import { useState } from "react";
import { Check, Pencil, Plus, Save, Search, Share2, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTask,
  deleteTask,
  getTasks,
  Task,
  TaskPayload,
  TaskPriority,
  TaskStatus,
  shareTask,
  toggleTask,
  updateTask,
} from "../services/tasks";
import { createCategory, getCategories } from "../services/categories";
import { getApiErrorMessage } from "../utils/errors";

const emptyForm: TaskPayload = {
  title: "",
  description: "",
  status: "pending",
  priority: "medium",
  category: null,
};

const defaultFilters = {
  status: "",
  priority: "",
  category: "",
  search: "",
  ordering: "-created_at",
  page: 1,
  page_size: 10,
};

export function TasksPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TaskPayload>(emptyForm);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<TaskPayload>(emptyForm);
  const [sharingTaskId, setSharingTaskId] = useState<number | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [categoryForm, setCategoryForm] = useState({ name: "", color: "#2563eb" });
  const [filters, setFilters] = useState(defaultFilters);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tasksQuery = useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => getTasks(filters),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const invalidateTasks = () => {
    void queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };
  const invalidateCategories = () => {
    void queryClient.invalidateQueries({ queryKey: ["categories"] });
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

  const shareMutation = useMutation({
    mutationFn: ({ id, email }: { id: number; email: string }) => shareTask(id, email),
    onSuccess: () => {
      setSharingTaskId(null);
      setShareEmail("");
      setErrorMessage(null);
      invalidateTasks();
    },
    onError: (error) => setErrorMessage(getApiErrorMessage(error)),
  });

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      setCategoryForm({ name: "", color: "#2563eb" });
      setErrorMessage(null);
      invalidateCategories();
    },
    onError: (error) => setErrorMessage(getApiErrorMessage(error)),
  });

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate(form);
  }

  function handleCreateCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createCategoryMutation.mutate(categoryForm);
  }

  function startEdit(task: Task) {
    setEditingTaskId(task.id);
    setEditingForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
    });
  }

  function handleShare(event: React.FormEvent<HTMLFormElement>, taskId: number) {
    event.preventDefault();
    shareMutation.mutate({ id: taskId, email: shareEmail });
  }

  const tasks = tasksQuery.data?.results ?? [];
  const categories = categoriesQuery.data?.results ?? [];

  return (
    <section className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Tasks</h1>
          <p className="muted">Plan, organize, and share your work.</p>
        </div>
        <span className="task-count">{tasksQuery.data?.count ?? 0} tasks</span>
      </div>
      <div className="workspace-grid">
        <aside className="side-panel">
          <h2>Categories</h2>
          <form className="category-form" onSubmit={handleCreateCategory}>
            <input
              aria-label="Category name"
              placeholder="Category name"
              value={categoryForm.name}
              onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
              required
            />
            <input
              aria-label="Category color"
              type="color"
              value={categoryForm.color}
              onChange={(event) => setCategoryForm({ ...categoryForm, color: event.target.value })}
            />
            <button type="submit" disabled={createCategoryMutation.isPending}>
              <Plus size={18} aria-hidden="true" />
            </button>
          </form>
          <div className="category-list">
            {categories.map((category) => (
              <span className="category-chip" key={category.id}>
                <span style={{ background: category.color }} />
                {category.name}
              </span>
            ))}
          </div>
        </aside>

        <div className="task-workspace">
          <div className="filters-bar">
            <label className="search-field">
              <Search size={18} aria-hidden="true" />
              <input
                aria-label="Search tasks"
                placeholder="Search tasks"
                value={filters.search}
                onChange={(event) => setFilters({ ...filters, search: event.target.value, page: 1 })}
              />
            </label>
            <select aria-label="Filter by status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value, page: 1 })}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
            <select aria-label="Filter by priority" value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value, page: 1 })}>
              <option value="">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select aria-label="Filter by category" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value, page: 1 })}>
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select aria-label="Order tasks" value={filters.ordering} onChange={(event) => setFilters({ ...filters, ordering: event.target.value, page: 1 })}>
              <option value="-created_at">Newest</option>
              <option value="created_at">Oldest</option>
              <option value="due_date">Due date</option>
              <option value="priority">Priority</option>
            </select>
          </div>

          <form className="task-form create-panel" onSubmit={handleCreate}>
        <div className="panel-heading">
          <h2>New task</h2>
        </div>
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
        <select
          aria-label="Task category"
          value={form.category ?? ""}
          onChange={(event) =>
            setForm({
              ...form,
              category: event.target.value ? Number(event.target.value) : null,
            })
          }
        >
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
        <button type="submit" disabled={createMutation.isPending}>
          <Plus size={18} aria-hidden="true" />
          {createMutation.isPending ? "Adding..." : "Add task"}
        </button>
      </form>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      {tasksQuery.isLoading ? <p className="muted">Loading tasks...</p> : null}

      <div className="task-list">
        {!tasksQuery.isLoading && tasks.length === 0 ? (
          <div className="empty-state">
            <h2>No tasks found</h2>
            <p className="muted">Create a task or adjust your filters.</p>
          </div>
        ) : null}
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
                  <select
                    aria-label="Edit task category"
                    value={editingForm.category ?? ""}
                    onChange={(event) =>
                      setEditingForm({
                        ...editingForm,
                        category: event.target.value ? Number(event.target.value) : null,
                      })
                    }
                  >
                    <option value="">No category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
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
                    {task.category ? (
                      <span>{categories.find((category) => category.id === task.category)?.name ?? "Category"}</span>
                    ) : null}
                    {task.shared_with.length ? <span>Shared with {task.shared_with.length}</span> : null}
                  </div>
                </div>
              )}

              {sharingTaskId === task.id ? (
                <form className="share-form" onSubmit={(event) => handleShare(event, task.id)}>
                  <span className="share-label">Share by email</span>
                  <input
                    aria-label="Share with email"
                    type="email"
                    placeholder="teammate@example.com"
                    value={shareEmail}
                    onChange={(event) => setShareEmail(event.target.value)}
                    required
                  />
                  <button className="icon-button subtle" type="submit" aria-label="Share task" title="Share task">
                    <Share2 size={18} aria-hidden="true" />
                  </button>
                  <button className="icon-button subtle" type="button" onClick={() => setSharingTaskId(null)} aria-label="Cancel sharing" title="Cancel sharing">
                    <X size={18} aria-hidden="true" />
                  </button>
                </form>
              ) : null}

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
                  <>
                    <button
                      className="icon-button subtle"
                      type="button"
                      onClick={() => startEdit(task)}
                      aria-label="Edit task"
                      title="Edit task"
                    >
                      <Pencil size={18} aria-hidden="true" />
                    </button>
                    <button
                      className="icon-button subtle"
                      type="button"
                      onClick={() => {
                        setSharingTaskId(task.id);
                        setShareEmail("");
                      }}
                      aria-label="Share task"
                      title="Share task"
                    >
                      <Share2 size={18} aria-hidden="true" />
                    </button>
                  </>
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
      <div className="pagination-bar">
        <button type="button" disabled={!tasksQuery.data?.previous} onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}>
          Previous
        </button>
        <span>Page {filters.page}</span>
        <button type="button" disabled={!tasksQuery.data?.next} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>
          Next
        </button>
        <select aria-label="Page size" value={filters.page_size} onChange={(event) => setFilters({ ...filters, page_size: Number(event.target.value), page: 1 })}>
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
        </select>
      </div>
        </div>
      </div>
    </section>
  );
}
