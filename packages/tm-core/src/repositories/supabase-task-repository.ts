import { SupabaseClient } from '@supabase/supabase-js';
import { Task } from '../types/index.js';
import { Database } from '../types/database.types.js';
import { TaskMapper } from '../mappers/TaskMapper.js';
import { AuthManager } from '../auth/auth-manager.js';
import { z } from 'zod';

// Type for task metadata stored in database
interface TaskMetadata {
	original_id?: string;
	details?: string;
	test_strategy?: string;
	complexity?: number;
	[key: string]: any;
}

// Zod schema for task status validation
const TaskStatusSchema = z.enum([
	'pending',
	'in-progress',
	'done',
	'review',
	'deferred',
	'cancelled',
	'blocked'
]);

// Zod schema for task updates
const TaskUpdateSchema = z
	.object({
		title: z.string().min(1).optional(),
		description: z.string().optional(),
		status: TaskStatusSchema.optional(),
		priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
		details: z.string().optional(),
		testStrategy: z.string().optional()
	})
	.partial();

export class SupabaseTaskRepository {
	constructor(private supabase: SupabaseClient<Database>) {}

	async getTasks(_projectId?: string): Promise<Task[]> {
		// Get the current context to determine briefId
		const authManager = AuthManager.getInstance();
		const context = authManager.getContext();

		if (!context || !context.briefId) {
			throw new Error(
				'No brief selected. Please select a brief first using: tm context brief'
			);
		}

		// Get all tasks for the brief using the exact query structure
		const { data: tasks, error } = await this.supabase
			.from('tasks')
			.select(`
        *,
        document:document_id (
          id,
          document_name,
          title,
          description
        )
      `)
			.eq('brief_id', context.briefId)
			.order('position', { ascending: true })
			.order('subtask_position', { ascending: true })
			.order('created_at', { ascending: true });

		if (error) {
			throw new Error(`Failed to fetch tasks: ${error.message}`);
		}

		if (!tasks || tasks.length === 0) {
			return [];
		}

		// Get all dependencies for these tasks
		const taskIds = tasks.map((t: any) => t.id);
		const { data: depsData, error: depsError } = await this.supabase
			.from('task_dependencies')
			.select('*')
			.in('task_id', taskIds);

		if (depsError) {
			throw new Error(
				`Failed to fetch task dependencies: ${depsError.message}`
			);
		}

		// Use mapper to convert to internal format
		return TaskMapper.mapDatabaseTasksToTasks(tasks, depsData || []);
	}

	async getTask(_projectId: string, taskId: string): Promise<Task | null> {
		// Get the current context to determine briefId (projectId not used in Supabase context)
		const authManager = AuthManager.getInstance();
		const context = authManager.getContext();

		if (!context || !context.briefId) {
			throw new Error(
				'No brief selected. Please select a brief first using: tm context brief'
			);
		}

		const { data, error } = await this.supabase
			.from('tasks')
			.select('*')
			.eq('brief_id', context.briefId)
			.eq('display_id', taskId.toUpperCase())
			.single();

		if (error) {
			if (error.code === 'PGRST116') {
				return null; // Not found
			}
			throw new Error(`Failed to fetch task: ${error.message}`);
		}

		// Get dependencies for this task
		const { data: depsData } = await this.supabase
			.from('task_dependencies')
			.select('*')
			.eq('task_id', taskId);

		// Get subtasks if this is a parent task
		const { data: subtasksData } = await this.supabase
			.from('tasks')
			.select('*')
			.eq('parent_task_id', taskId)
			.order('subtask_position', { ascending: true });

		// Create dependency map
		const dependenciesByTaskId = new Map<string, string[]>();
		if (depsData) {
			dependenciesByTaskId.set(
				taskId,
				depsData.map(
					(d: Database['public']['Tables']['task_dependencies']['Row']) =>
						d.depends_on_task_id
				)
			);
		}

		// Use mapper to convert single task
		return TaskMapper.mapDatabaseTaskToTask(
			data,
			subtasksData || [],
			dependenciesByTaskId
		);
	}

	async updateTask(
		projectId: string,
		taskId: string,
		updates: Partial<Task>
	): Promise<Task> {
		// Get the current context to determine briefId
		const authManager = AuthManager.getInstance();
		const context = authManager.getContext();

		if (!context || !context.briefId) {
			throw new Error(
				'No brief selected. Please select a brief first using: tm context brief'
			);
		}

		// Validate updates using Zod schema
		try {
			TaskUpdateSchema.parse(updates);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const errorMessages = error.errors
					.map((err) => `${err.path.join('.')}: ${err.message}`)
					.join(', ');
				throw new Error(`Invalid task update data: ${errorMessages}`);
			}
			throw error;
		}

		// Convert Task fields to database fields - only include fields that actually exist in the database
		const dbUpdates: any = {};

		if (updates.title !== undefined) dbUpdates.title = updates.title;
		if (updates.description !== undefined)
			dbUpdates.description = updates.description;
		if (updates.status !== undefined)
			dbUpdates.status = this.mapStatusToDatabase(updates.status);
		if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
		// Skip fields that don't exist in database schema: details, testStrategy, etc.

		// Update the task
		const { error } = await this.supabase
			.from('tasks')
			.update(dbUpdates)
			.eq('brief_id', context.briefId)
			.eq('display_id', taskId.toUpperCase());

		if (error) {
			throw new Error(`Failed to update task: ${error.message}`);
		}

		// Return the updated task by fetching it
		const updatedTask = await this.getTask(projectId, taskId);
		if (!updatedTask) {
			throw new Error(`Failed to retrieve updated task ${taskId}`);
		}

		return updatedTask;
	}

	/**
	 * Extract tasks to a brief
	 * Creates tasks in the target brief from the provided task data
	 */
	async extractTasks(
		targetBriefId: string,
		tasks: any[]
	): Promise<{ success: boolean; count: number; error?: string }> {
		try {
			// Validate that the target brief exists and user has access
			const { data: briefData, error: briefError } = await this.supabase
				.from('brief')
				.select('id, account_id')
				.eq('id', targetBriefId)
				.single();

			if (briefError || !briefData) {
				return {
					success: false,
					count: 0,
					error: 'Target brief not found or you do not have access'
				};
			}

			const accountId = briefData.account_id;
			let totalInserted = 0;

			// Phase 1: Insert parent tasks first
			const parentTasks = this.prepareParentTasks(
				targetBriefId,
				accountId,
				tasks
			);

			const { data: insertedParents, error: parentError } = await this.supabase
				.from('tasks')
				.insert(parentTasks)
				.select('id, metadata');

			if (parentError) {
				return {
					success: false,
					count: 0,
					error: `Failed to extract parent tasks: ${parentError.message}`
				};
			}

			totalInserted += insertedParents?.length || 0;

			// Create mapping from original IDs to actual database UUIDs
			const idMapping = new Map<string, string>();
			insertedParents?.forEach((task) => {
				const metadata = task.metadata as TaskMetadata;
				if (metadata?.original_id) {
					idMapping.set(metadata.original_id, task.id);
				}
			});

			// Phase 2: Prepare and insert subtasks with correct parent_task_id
			const subtaskBatches: any[] = [];
			tasks.forEach((task) => {
				if (task.subtasks && task.subtasks.length > 0) {
					const parentId = idMapping.get(task.id);
					if (parentId) {
						const subtasks = this.prepareSubtasks(
							targetBriefId,
							accountId,
							task.subtasks,
							parentId
						);
						subtaskBatches.push(...subtasks);
					}
				}
			});

			if (subtaskBatches.length > 0) {
				const { data: insertedSubtasks, error: subtaskError } =
					await this.supabase
						.from('tasks')
						.insert(subtaskBatches)
						.select('id, metadata');

				if (subtaskError) {
					console.warn(
						`Warning: Some subtasks could not be created: ${subtaskError.message}`
					);
				} else {
					totalInserted += insertedSubtasks?.length || 0;

					// Update ID mapping with subtask IDs for dependency creation
					insertedSubtasks?.forEach((task) => {
						const metadata = task.metadata as TaskMetadata;
						if (metadata?.original_id) {
							idMapping.set(metadata.original_id, task.id);
						}
					});
				}
			}

			// Phase 3: Handle dependencies if any tasks have them
			const dependenciesToCreate = this.prepareDependencies(tasks, idMapping);

			if (dependenciesToCreate.length > 0) {
				const { error: depError } = await this.supabase
					.from('task_dependencies')
					.insert(dependenciesToCreate);

				if (depError) {
					console.warn(
						`Warning: Some dependencies could not be created: ${depError.message}`
					);
				}
			}

			return {
				success: true,
				count: totalInserted
			};
		} catch (error) {
			return {
				success: false,
				count: 0,
				error: error instanceof Error ? error.message : String(error)
			};
		}
	}

	/**
	 * Prepare parent tasks only (no subtasks)
	 */
	private prepareParentTasks(
		briefId: string,
		accountId: string,
		tasks: any[]
	): any[] {
		return tasks.map((task, index) => ({
			account_id: accountId,
			brief_id: briefId,
			title: task.title || 'Untitled Task',
			description: task.description || '',
			status: this.mapStatusToDatabase(task.status || 'pending'),
			priority: task.priority || 'medium',
			position: index + 1,
			// Store original ID and additional fields in metadata
			metadata: {
				original_id: task.id,
				details: task.details,
				test_strategy: task.testStrategy,
				complexity: task.complexity
			}
		}));
	}

	/**
	 * Prepare subtasks with their parent_task_id (UUID)
	 */
	private prepareSubtasks(
		briefId: string,
		accountId: string,
		subtasks: any[],
		parentTaskId: string
	): any[] {
		return subtasks.map((subtask, index) => ({
			account_id: accountId,
			brief_id: briefId,
			title: subtask.title || 'Untitled Subtask',
			description: subtask.description || '',
			status: this.mapStatusToDatabase(subtask.status || 'pending'),
			priority: subtask.priority || 'medium',
			parent_task_id: parentTaskId,
			subtask_position: index + 1,
			// Store original ID for dependency mapping
			metadata: {
				original_id: subtask.id,
				details: subtask.details,
				test_strategy: subtask.testStrategy,
				complexity: subtask.complexity
			}
		}));
	}

	/**
	 * Prepare task dependencies for insertion
	 */
	private prepareDependencies(
		originalTasks: any[],
		idMapping: Map<string, string>
	): any[] {
		const dependencies: any[] = [];

		// Process dependencies for all tasks (including subtasks)
		const processTaskDependencies = (tasks: any[]) => {
			tasks.forEach((task) => {
				if (task.dependencies && task.dependencies.length > 0) {
					const taskId = idMapping.get(task.id);
					if (taskId) {
						task.dependencies.forEach((depId: string) => {
							const dependsOnId = idMapping.get(depId);
							if (dependsOnId) {
								dependencies.push({
									task_id: taskId,
									depends_on_task_id: dependsOnId
								});
							}
						});
					}
				}

				// Process subtask dependencies too
				if (task.subtasks && task.subtasks.length > 0) {
					processTaskDependencies(task.subtasks);
				}
			});
		};

		processTaskDependencies(originalTasks);
		return dependencies;
	}

	/**
	 * Maps internal status to database status
	 */
	private mapStatusToDatabase(
		status: string
	): Database['public']['Enums']['task_status'] {
		switch (status) {
			case 'pending':
				return 'todo';
			case 'in-progress':
			case 'in_progress': // Accept both formats
				return 'in_progress';
			case 'done':
				return 'done';
			default:
				throw new Error(
					`Invalid task status: ${status}. Valid statuses are: pending, in-progress, done`
				);
		}
	}
}
