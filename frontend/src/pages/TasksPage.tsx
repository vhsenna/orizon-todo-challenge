import { useState } from "react";
import { Check, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTask,
  deleteTask,
  getTasks,
  Task,
  TaskPayload,
  TaskPriority,
  TaskStatus,
  toggleTask,
  updateTask,
} from "../services/tasks";
import { getApiErrorMessage } from "../utils/errors";

const emptyForm: TaskPayload = {
  title: "",
  description: "",
  status: "pending",
  priority: "medium",
};

export function TasksPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TaskPayload>(emptyForm);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<TaskPayload>(emptyForm);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });

  const invalidateTasks = () => {
    void queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      setForm(emptyForm);
      setErrorMessage(null);
      invalidateTasks();
    },
    onError: (error) => setErrorMessage(getApiErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<TaskPayload> }) =>
      updateTask(id, payload),
    onSuccess: () => {
      setEditingTaskId(null);
      setErrorMessage(null);
      invalidateTasks();
    },
    onError: (error) => setErrorMessage(getApiErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: invalidateTasks,
    onError: (error) => setErrorMessage(getApiErrorMessage(error)),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleTask,
    onSuccess: invalidateTasks,
    onError: (error) => setErrorMessage(getApiErrorMessage(error)),
  });

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate(form);
  }

  function startEdit(task: Task) {
    setEditingTaskId(task.id);
    setEditingForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
    });
  }

  const tasks = tasksQuery.data?.results ?? [];

  return (
    <section className="dashboard">
      <div className="dashboard-header">
        <h1>Tasks</h1>
        <p className="muted">{tasksQuery.data?.count ?? 0} tasks</p>
      </div>
      <form className="task-form" onSubmit={handleCreate}>
        <input
          aria-label="Task title"
          placeholder="Task title"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          required
        />
        <textarea
          aria-label="Task description"
          placeholder="Description"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
        <select
          aria-label="Task status"
          value={form.status}
          onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
        <select
          aria-label="Task priority"
          value={form.priority}
          onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit" disabled={createMutation.isPending}>
          <Plus size={18} aria-hidden="true" />
          {createMutation.isPending ? "Adding..." : "Add task"}
        </button>
      </form>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      {tasksQuery.isLoading ? <p className="muted">Loading tasks...</p> : null}

      <div className="task-list">
        {tasks.map((task) => {
          const isEditing = editingTaskId === task.id;

          return (
            <article className="task-item" key={task.id}>
              {isEditing ? (
                <div className="task-edit-grid">
                  <input
                    aria-label="Edit task title"
                    value={editingForm.title}
                    onChange={(event) =>
                      setEditingForm({ ...editingForm, title: event.target.value })
                    }
                  />
                  <textarea
                    aria-label="Edit task description"
                    value={editingForm.description}
                    onChange={(event) =>
                      setEditingForm({ ...editingForm, description: event.target.value })
                    }
                  />
                  <select
                    aria-label="Edit task status"
                    value={editingForm.status}
                    onChange={(event) =>
                      setEditingForm({
                        ...editingForm,
                        status: event.target.value as TaskStatus,
                      })
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <select
                    aria-label="Edit task priority"
                    value={editingForm.priority}
                    onChange={(event) =>
                      setEditingForm({
                        ...editingForm,
                        priority: event.target.value as TaskPriority,
                      })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              ) : (
                <div>
                  <h2 className={task.status === "completed" ? "task-title completed" : "task-title"}>
                    {task.title}
                  </h2>
                  {task.description ? <p className="task-description">{task.description}</p> : null}
                  <div className="task-meta">
                    <span>{task.status.replace("_", " ")}</span>
                    <span>{task.priority}</span>
                  </div>
                </div>
              )}

              <div className="task-actions">
                <button
                  className="icon-button subtle"
                  type="button"
                  onClick={() => toggleMutation.mutate(task.id)}
                  aria-label="Toggle completion"
                  title="Toggle completion"
                >
                  <Check size={18} aria-hidden="true" />
                </button>
                {isEditing ? (
                  <>
                    <button
                      className="icon-button subtle"
                      type="button"
                      onClick={() => updateMutation.mutate({ id: task.id, payload: editingForm })}
                      aria-label="Save task"
                      title="Save task"
                    >
                      <Save size={18} aria-hidden="true" />
                    </button>
                    <button
                      className="icon-button subtle"
                      type="button"
                      onClick={() => setEditingTaskId(null)}
                      aria-label="Cancel editing"
                      title="Cancel editing"
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <button
                    className="icon-button subtle"
                    type="button"
                    onClick={() => startEdit(task)}
                    aria-label="Edit task"
                    title="Edit task"
                  >
                    <Pencil size={18} aria-hidden="true" />
                  </button>
                )}
                <button
                  className="icon-button danger"
                  type="button"
                  onClick={() => deleteMutation.mutate(task.id)}
                  aria-label="Delete task"
                  title="Delete task"
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
