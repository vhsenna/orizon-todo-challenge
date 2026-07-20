import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Pencil,
  Plus,
  Save,
  Search,
  Share2,
  Trash2,
  X,
} from "lucide-react";
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
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../services/categories";
import { getApiErrorMessage } from "../utils/errors";

type TaskFormState = Omit<TaskPayload, "due_date"> & {
  due_date: string;
};

const emptyForm: TaskFormState = {
  title: "",
  description: "",
  status: "pending",
  priority: "medium",
  due_date: "",
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

function toApiPayload(form: TaskFormState): TaskPayload {
  return {
    ...form,
    due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
  };
}

function toDateTimeInput(value: string | null): string {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function formatDueDate(value: string | null): string | null {
  if (!value) {
    return null;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function TasksPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<TaskFormState>(emptyForm);
  const [sharingTaskId, setSharingTaskId] = useState<number | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [categoryForm, setCategoryForm] = useState({ name: "", color: "#2563eb" });
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryForm, setEditingCategoryForm] = useState({
    name: "",
    color: "#2563eb",
  });
  const [filters, setFilters] = useState(defaultFilters);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const summaryFilters = useMemo(
    () => ({
      ...filters,
      status: "",
      page: 1,
      page_size: 1,
    }),
    [filters],
  );

  const completedSummaryFilters = useMemo(
    () => ({
      ...summaryFilters,
      status: "completed",
    }),
    [summaryFilters],
  );

  const tasksQuery = useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => getTasks(filters),
  });

  const summaryQuery = useQuery({
    queryKey: ["tasks", "summary", summaryFilters],
    queryFn: () => getTasks(summaryFilters),
  });

  const completedSummaryQuery = useQuery({
    queryKey: ["tasks", "summary", completedSummaryFilters],
    queryFn: () => getTasks(completedSummaryFilters),
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

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { name: string; color: string } }) =>
      updateCategory(id, payload),
    onSuccess: () => {
      setEditingCategoryId(null);
      setErrorMessage(null);
      invalidateCategories();
      invalidateTasks();
    },
    onError: (error) => setErrorMessage(getApiErrorMessage(error)),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      setErrorMessage(null);
      invalidateCategories();
      invalidateTasks();
    },
    onError: (error) => setErrorMessage(getApiErrorMessage(error)),
  });

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createMutation.mutate(toApiPayload(form));
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
      due_date: toDateTimeInput(task.due_date),
      category: task.category,
    });
  }

  function startCategoryEdit(category: { id: number; name: string; color: string }) {
    setEditingCategoryId(category.id);
    setEditingCategoryForm({ name: category.name, color: category.color });
  }

  function handleShare(event: React.FormEvent<HTMLFormElement>, taskId: number) {
    event.preventDefault();
    shareMutation.mutate({ id: taskId, email: shareEmail });
  }

  const tasks = tasksQuery.data?.results ?? [];
  const categories = categoriesQuery.data?.results ?? [];
  const totalCount = summaryQuery.data?.count ?? tasksQuery.data?.count ?? 0;
  const completedCount =
    completedSummaryQuery.data?.count ?? tasks.filter((task) => task.status === "completed").length;
  const openCount = Math.max(totalCount - completedCount, 0);

  return (
    <section className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Tasks</h1>
          <p className="muted">Plan, organize, and share your work.</p>
        </div>
        <div className="task-summary">
          <span>{totalCount} total</span>
          <span>{openCount} open</span>
          <span>{completedCount} completed</span>
        </div>
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
            <button type="submit" disabled={createCategoryMutation.isPending} aria-label="Add category">
              <Plus size={18} aria-hidden="true" />
            </button>
          </form>
          <div className="category-list">
            {categories.map((category) =>
              editingCategoryId === category.id ? (
                <form
                  className="category-edit-row"
                  key={category.id}
                  onSubmit={(event) => {
                    event.preventDefault();
                    updateCategoryMutation.mutate({
                      id: category.id,
                      payload: editingCategoryForm,
                    });
                  }}
                >
                  <input
                    aria-label="Edit category name"
                    value={editingCategoryForm.name}
                    onChange={(event) =>
                      setEditingCategoryForm({
                        ...editingCategoryForm,
                        name: event.target.value,
                      })
                    }
                    required
                  />
                  <input
                    aria-label="Edit category color"
                    type="color"
                    value={editingCategoryForm.color}
                    onChange={(event) =>
                      setEditingCategoryForm({
                        ...editingCategoryForm,
                        color: event.target.value,
                      })
                    }
                  />
                  <button className="icon-button subtle" type="submit" aria-label="Save category">
                    <Save size={18} aria-hidden="true" />
                  </button>
                  <button
                    className="icon-button subtle"
                    type="button"
                    onClick={() => setEditingCategoryId(null)}
                    aria-label="Cancel category edit"
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                </form>
              ) : (
                <div className="category-row" key={category.id}>
                  <span className="category-chip">
                    <span style={{ background: category.color }} />
                    {category.name}
                  </span>
                  <button
                    className="icon-button subtle"
                    type="button"
                    onClick={() => startCategoryEdit(category)}
                    aria-label="Edit category"
                    title="Edit category"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => deleteCategoryMutation.mutate(category.id)}
                    aria-label="Delete category"
                    title="Delete category"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              ),
            )}
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
            <select
              aria-label="Filter by status"
              value={filters.status}
              onChange={(event) => setFilters({ ...filters, status: event.target.value, page: 1 })}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              aria-label="Filter by priority"
              value={filters.priority}
              onChange={(event) => setFilters({ ...filters, priority: event.target.value, page: 1 })}
            >
              <option value="">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select
              aria-label="Filter by category"
              value={filters.category}
              onChange={(event) => setFilters({ ...filters, category: event.target.value, page: 1 })}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Order tasks"
              value={filters.ordering}
              onChange={(event) => setFilters({ ...filters, ordering: event.target.value, page: 1 })}
            >
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
              onChange={(event) =>
                setForm({ ...form, priority: event.target.value as TaskPriority })
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <label className="date-field">
              <CalendarDays size={18} aria-hidden="true" />
              <input
                aria-label="Task due date"
                type="datetime-local"
                value={form.due_date}
                onChange={(event) => setForm({ ...form, due_date: event.target.value })}
              />
            </label>
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
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
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
              const dueDate = formatDueDate(task.due_date);

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
                          setEditingForm({
                            ...editingForm,
                            description: event.target.value,
                          })
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
                      <label className="date-field">
                        <CalendarDays size={18} aria-hidden="true" />
                        <input
                          aria-label="Edit task due date"
                          type="datetime-local"
                          value={editingForm.due_date}
                          onChange={(event) =>
                            setEditingForm({
                              ...editingForm,
                              due_date: event.target.value,
                            })
                          }
                        />
                      </label>
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
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <h2
                        className={
                          task.status === "completed" ? "task-title completed" : "task-title"
                        }
                      >
                        {task.title}
                      </h2>
                      {task.description ? <p className="task-description">{task.description}</p> : null}
                      <div className="task-meta">
                        <span>{task.status.replace("_", " ")}</span>
                        <span>{task.priority}</span>
                        {dueDate ? <span>Due {dueDate}</span> : null}
                        {task.category ? (
                          <span>
                            {categories.find((category) => category.id === task.category)?.name ??
                              "Category"}
                          </span>
                        ) : null}
                        {!task.is_owner ? <span>Shared with you</span> : null}
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
                      <button
                        className="icon-button subtle"
                        type="submit"
                        aria-label="Share task"
                        title="Share task"
                      >
                        <Share2 size={18} aria-hidden="true" />
                      </button>
                      <button
                        className="icon-button subtle"
                        type="button"
                        onClick={() => setSharingTaskId(null)}
                        aria-label="Cancel sharing"
                        title="Cancel sharing"
                      >
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
                          onClick={() =>
                            updateMutation.mutate({
                              id: task.id,
                              payload: toApiPayload(editingForm),
                            })
                          }
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
                        {task.is_owner ? (
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
                        ) : null}
                      </>
                    )}
                    {task.is_owner ? (
                      <button
                        className="icon-button danger"
                        type="button"
                        onClick={() => deleteMutation.mutate(task.id)}
                        aria-label="Delete task"
                        title="Delete task"
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="pagination-bar">
            <button
              type="button"
              disabled={!tasksQuery.data?.previous}
              onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
            >
              Previous
            </button>
            <span>Page {filters.page}</span>
            <button
              type="button"
              disabled={!tasksQuery.data?.next}
              onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            >
              Next
            </button>
            <select
              aria-label="Page size"
              value={filters.page_size}
              onChange={(event) =>
                setFilters({ ...filters, page_size: Number(event.target.value), page: 1 })
              }
            >
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
