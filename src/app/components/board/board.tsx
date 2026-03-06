import { useEffect, useState } from 'react'
import './board.css'

interface Task {
    id: number
    title: string
    description: string
    status: 'todo' | 'in_progress' | 'done'
}
const columns = [
    { key: 'todo' as const, label: 'Do zrobienia' },
    { key: 'in_progress' as const, label: 'W trakcie' },
    { key: 'done' as const, label: 'Zrobione' },
]

export default function Board() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [nextId, setNextId] = useState(1)
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [newTaskDescription, setNewTaskDescription] = useState('')

    useEffect(() => {
        const tasksData = localStorage.getItem('tasksData')
        if (tasksData) {
            const parsed = JSON.parse(tasksData)
            setTasks(parsed.tasks)
            setNextId(parsed.nextId)
        }
    }, [])

    const saveToLocalStorage = (updatedTasks: Task[], updatedNextId: number) => {
        localStorage.setItem('tasksData', JSON.stringify({
            tasks: updatedTasks,
            nextId: updatedNextId,
        }))
    }

    const handleAddTask = () => { 
        const newTask: Task = {
            id: nextId,
            title: newTaskTitle,
            description: newTaskDescription,
            status: 'todo'
        }
        const updatedTasks = [...tasks, newTask]
        const updatedNextId = nextId + 1
        setTasks(updatedTasks)
        setNextId(updatedNextId)
        setNewTaskTitle('')
        setNewTaskDescription('')
        saveToLocalStorage(updatedTasks, updatedNextId)
    }

    const moveTask = (taskId: number, newStatus: Task['status']) => {
        const updatedTasks = tasks.map(t =>
            t.id === taskId ? { ...t, status: newStatus } : t
        )
        setTasks(updatedTasks)
        saveToLocalStorage(updatedTasks, nextId)
    }

    const deleteTask = (taskId: number) => {
        const updatedTasks = tasks.filter(t => t.id !== taskId)
        setTasks(updatedTasks)
        saveToLocalStorage(updatedTasks, nextId)
    }

    return (
        <div className="board-container">
            <h1 className="board-title">Tablica zadań</h1>

            <div className="board-add-task">
                <input
                    type="text"
                    placeholder="Nowe zadanie..."
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                />
                <input
                    type="text"
                    placeholder="Opis nowego zadania..."
                    value={newTaskDescription}
                    onChange={e => setNewTaskDescription(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                />
                <button onClick={handleAddTask}>Dodaj</button>
            </div>

            <div className="board-columns">
                {columns.map(col => (
                    <div key={col.key} className={`board-column board-column--${col.key}`}>
                        <h2 className="board-column__header">{col.label}</h2>
                        <div className="board-column__tasks">
                            {tasks
                                .filter(t => t.status === col.key)
                                .map(task => (
                                    <div key={task.id} className="board-task">
                                        <span className="board-task__title">{task.title}</span>
                                        <span className="board-task__description">{task.description}</span>
                                        <div className="board-task__actions">
                                            {col.key !== 'todo' && (
                                                <button
                                                    className="board-task__btn board-task__btn--left"
                                                    onClick={() =>
                                                        moveTask(
                                                            task.id,
                                                            col.key === 'in_progress' ? 'todo' : 'in_progress'
                                                        )
                                                    }
                                                    title="Przenieś w lewo"
                                                >
                                                    ←
                                                </button>
                                            )}
                                            {col.key !== 'done' && (
                                                <button
                                                    className="board-task__btn board-task__btn--right"
                                                    onClick={() =>
                                                        moveTask(
                                                            task.id,
                                                            col.key === 'todo' ? 'in_progress' : 'done'
                                                        )
                                                    }
                                                    title="Przenieś w prawo"
                                                >
                                                    →
                                                </button>
                                            )}
                                            <button
                                                className="board-task__btn board-task__btn--delete"
                                                onClick={() => deleteTask(task.id)}
                                                title="Usuń"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            {tasks.filter(t => t.status === col.key).length === 0 && (
                                <p className="board-column__empty">Brak zadań</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
