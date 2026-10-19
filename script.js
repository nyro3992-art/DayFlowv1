// =====================================
// DAYFLOW - TASK SYSTEM
// =====================================

// Get the task area
const taskList = document.querySelector(".task-list");

// Get all Add Task buttons
const addTaskButtons = document.querySelectorAll(".add-task-btn");

// Store tasks
let tasks = [];


// =====================================
// ADD TASK
// =====================================

function addTask() {

    const taskName = prompt("Enter your task:");

    // Stop if user cancels
    if (taskName === null) {
        return;
    }

    // Stop if input is empty
    if (taskName.trim() === "") {
        alert("Please enter a task.");
        return;
    }

    // Create task
    const task = {
        name: taskName.trim(),
        completed: false
    };

    // Add task to array
    tasks.push(task);

    // Show tasks
    displayTasks();
}


// =====================================
// DISPLAY TASKS
// =====================================

function displayTasks() {

    // Clear old tasks
    taskList.innerHTML = "";

    tasks.forEach(function(task, index) {

        // Create task box
        const taskItem = document.createElement("div");

        taskItem.className = "task-item";

        taskItem.innerHTML = `
            
            <div class="task-left">

                <button class="task-check">
                    ${task.completed ? "✓" : ""}
                </button>

                <span class="${task.completed ? "task-completed" : ""}">
                    ${task.name}
                </span>

            </div>

            <button class="delete-task">
                🗑️
            </button>

        `;

        // Put task on website
        taskList.appendChild(taskItem);


        // =================================
        // COMPLETE TASK
        // =================================

        const checkButton =
            taskItem.querySelector(".task-check");

        checkButton.addEventListener("click", function() {

            task.completed = !task.completed;

            displayTasks();

        });


        // =================================
        // DELETE TASK
        // =================================

        const deleteButton =
            taskItem.querySelector(".delete-task");

        deleteButton.addEventListener("click", function() {

            tasks.splice(index, 1);

            displayTasks();

        });

    });

}


// =====================================
// CONNECT ADD TASK BUTTONS
// =====================================

addTaskButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        addTask();

    });

});