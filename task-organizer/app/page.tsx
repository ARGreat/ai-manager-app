"use client";

import React, { useEffect, useState } from "react";
import TaskList from "@/components/TaskList";
import Navbar from "@/components/Navbar";

interface Task {
    name: string;
    assignedTo?: string;
    dueDate?: string;
    completed?: boolean;
}

interface Category {
    category: string;
    tasks: Task[];
}

const categoryColors = [
    "bg-orange-100",
    "bg-pink-100",
    "bg-blue-100",
    "bg-green-100",
    "bg-purple-100",
];

const getCategoryColor = (index: number) => {
    return categoryColors[index] || "bg-gray-100";
};

const TaskPage: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [assignments, setAssignments] = useState<Record<string, string>>({});
    const [taskCompletion, setTaskCompletion] = useState<Record<string, boolean>>({});
    const [teamMembers, setTeamMembers] = useState<string[]>(["Alice", "Bob", "Charlie", "David"]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const savedAssignments = localStorage.getItem("assignments");
        if (savedAssignments) {
            setAssignments(JSON.parse(savedAssignments));
        }

        const savedCompletion = localStorage.getItem("taskCompletion");
        if (savedCompletion) {
            setTaskCompletion(JSON.parse(savedCompletion));
        }
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                console.log('Fetching categories from /api/getToDo');
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/getToDo`);
                console.log('Response status:', response.status);
                if (!response.ok) {
                    throw new Error("Failed to fetch categories");
                }
                const data: Category[] = await response.json();
                console.log('Fetched categories:', data);

                const updatedData = data.map((cat) => ({
                    category: cat.category,
                    tasks: cat.tasks.map((task) => ({
                        name: task.name,
                        dueDate: task.dueDate || undefined,
                        assignedTo: assignments[task.name] || undefined,
                        completed: taskCompletion[task.name] || false,
                    })),
                }));

                setCategories(updatedData);
            } catch (error) {
                console.error("Error fetching categories:", error);
                setError("Failed to load tasks. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, [assignments, taskCompletion]);

    const handleAssignTask = (taskName: string, member: string) => {
        const updatedAssignments = { ...assignments, [taskName]: member };
        setAssignments(updatedAssignments);
        localStorage.setItem("assignments", JSON.stringify(updatedAssignments));

        // If the task is being reassigned (member is not empty), mark it as uncompleted
        if (member !== "") {
            const updatedCompletion = { ...taskCompletion, [taskName]: false };
            setTaskCompletion(updatedCompletion);
            localStorage.setItem("taskCompletion", JSON.stringify(updatedCompletion));
        }
    };

    const handleToggleCompletion = (taskName: string) => {
        const updatedCompletion = { ...taskCompletion, [taskName]: !taskCompletion[taskName] };
        setTaskCompletion(updatedCompletion);
        localStorage.setItem("taskCompletion", JSON.stringify(updatedCompletion));
    };

    const handleClearAssignments = () => {
        setAssignments({});
        localStorage.removeItem("assignments");
    };

    const addTeamMember = () => {
        const newMember = prompt("Enter team member name:");
        if (newMember && !teamMembers.includes(newMember)) {
            setTeamMembers([...teamMembers, newMember]);
        }
    };

    const removeTeamMember = (member: string) => {
        const confirmDelete = window.confirm(`Are you sure you want to remove "${member}" from the team?`);
        if (!confirmDelete) return;

        const updatedMembers = teamMembers.filter((m) => m !== member);
        setTeamMembers(updatedMembers);

        const updatedAssignments = { ...assignments };
        Object.keys(updatedAssignments).forEach((task) => {
            if (updatedAssignments[task] === member) {
                delete updatedAssignments[task];
            }
        });

        setAssignments(updatedAssignments);
        localStorage.setItem("assignments", JSON.stringify(updatedAssignments));
    };

    const handleDragStart = (event: React.DragEvent, taskName: string) => {
        event.dataTransfer.setData("taskName", taskName);
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
    };

    const handleDrop = (event: React.DragEvent, member: string) => {
        event.preventDefault();
        const taskName = event.dataTransfer.getData("taskName");
        handleAssignTask(taskName, member);
    };

    if (isLoading) return <div className="text-center py-4">Loading...</div>;
    if (error) return <div className="text-center py-4 text-red-500">{error}</div>;

    return (
        <main className="flex min-h-screen flex-col bg-gray-50">
            <Navbar />
            <div className="flex w-full p-6 gap-8">
                <div className="w-1/2 bg-white p-4 rounded-lg shadow-md">
                    <h1 className="text-xl font-bold mb-4">Tasks</h1>
                    {categories.map((data, index) => (
                        <div key={index} className={`mb-4 p-4 rounded-lg ${getCategoryColor(index)}`}>
                            <TaskList
                                tasks={data.tasks}
                                category={data.category}
                                teamMembers={teamMembers}
                                onAssign={handleAssignTask}
                                onDragStart={handleDragStart}
                            />
                        </div>
                    ))}
                </div>

                <div className="w-1/2">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold mb-4">Team Members</h2>
                        <button
                            onClick={addTeamMember}
                            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                        >
                            + Add Team Member
                        </button>
                    </div>
                    <div className="flex flex-col gap-4">
                        {teamMembers.map((member) => {
                            const assignedTasks = Object.entries(assignments)
                                .filter(([_, assignedMember]) => assignedMember === member)
                                .map(([taskName]) => {
                                    const task = categories
                                        .flatMap((cat) => cat.tasks)
                                        .find((t) => t.name === taskName);
                                    const category = categories.find((cat) =>
                                        cat.tasks.some((t) => t.name === taskName)
                                    )?.category;
                                    return {
                                        name: taskName,
                                        dueDate: task?.dueDate,
                                        completed: taskCompletion[taskName] || false,
                                        category: category || "Uncategorized", // Fallback for tasks without a category
                                    };
                                })
                                .sort((a, b) => {
                                    // Move completed tasks to the bottom
                                    if (a.completed && !b.completed) return 1;
                                    if (!a.completed && b.completed) return -1;
                                    return 0;
                                });

                            return (
                                <div
                                    key={member}
                                    className="bg-white p-4 rounded-lg shadow-md relative"
                                    onDragOver={handleDragOver}
                                    onDrop={(event) => handleDrop(event, member)}
                                >
                                    <button
                                        onClick={() => removeTeamMember(member)}
                                        className="absolute top-2 right-2 text-red-500 text-sm font-bold hover:text-red-700"
                                    >
                                        ✖
                                    </button>
                                    <h3 className="text-lg font-semibold">{member}</h3>
                                    <ul className="mt-2">
                                        {assignedTasks.map((task, index) => {
                                            const categoryIndex = categories.findIndex(
                                                (cat) => cat.category === task.category
                                            );
                                            const categoryColor = getCategoryColor(categoryIndex);

                                            return (
                                                <li
                                                    key={index}
                                                    className={`p-2 rounded mt-1 flex justify-between items-center ${
                                                        task.completed ? "bg-green-100 line-through" : "bg-gray-200"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {/* Colored rectangle */}
                                                        <div
                                                            className={`w-2 h-6 ${categoryColor}`}
                                                            style={{ minWidth: "8px" }} // Ensure the rectangle has a minimum width
                                                        ></div>
                                                        <span>{task.name}</span>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={task.completed || false}
                                                        onChange={() => handleToggleCompletion(task.name)}
                                                        className="cursor-pointer"
                                                    />
                                                </li>
                                            );
                                        })}
                                        {assignedTasks.length === 0 && (
                                            <p className="text-gray-500">No tasks assigned</p>
                                        )}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={handleClearAssignments} className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
                        Clear All Assignments
                    </button>
                </div>
            </div>
        </main>
    );
};

export default TaskPage;