import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { MatCardModule } from '@angular/material/card';


import { 
  CdkDragDrop, 
  DragDropModule, 
  moveItemInArray, 
  transferArrayItem 
} from '@angular/cdk/drag-drop';


import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';


import { MatIconModule } from '@angular/material/icon';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component'; 


export interface ITask {
  id: number;
  title: string;
}

@Component({
  selector: 'app-root',
  standalone: true, 
  imports: [
    RouterOutlet,
    CommonModule,    
    MatCardModule,  
    DragDropModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    UserDashboardComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css' 
})
export class App { 
  protected readonly title = signal('mi-tablero-kanban');
  
  showUserDashboard = false;
  
  private fb = inject(FormBuilder);

  
  taskForm = this.fb.group({
    title: ['', Validators.required]
  });

 
  todo: ITask[] = [
    
  ];

  inProgress: ITask[] = [];

  done: ITask[] = [
    
  ];

  // Mock data for user dashboard
  userTasks = [
    {
      id: 1,
      title: 'Revisar especificaciones del proyecto',
      area: 'Ingeniería',
      priority: 'alta' as const,
      status: 'en_proceso' as const,
      dueDate: '2025-11-15',
      estimatedPay: 150,
      description: 'Revisar los documentos de especificación técnica'
    },
    {
      id: 2,
      title: 'Implementar validaciones backend',
      area: 'Ingeniería',
      priority: 'alta' as const,
      status: 'asignada' as const,
      dueDate: '2025-11-16',
      estimatedPay: 200,
      description: 'Crear validaciones en los endpoints'
    },
    {
      id: 3,
      title: 'Documentación API',
      area: 'Ingeniería',
      priority: 'media' as const,
      status: 'asignada' as const,
      dueDate: '2025-11-18',
      estimatedPay: 100,
      description: 'Documentar endpoints principales'
    }
  ];
 
// METODOS PARA EL MANEJO DE TAREAS   

// 1. Agregar Tarea
addTask(): void {
    if (this.taskForm.valid) {
      const newTitle = this.taskForm.value.title;
      // Añadido chequeo de newTitle por si el FormBuilder devuelve null/undefined
      if (newTitle) { 
        const newTask: ITask = {
          id: Date.now(),
          title: newTitle
        };
        this.todo.unshift(newTask);
        this.taskForm.reset();
      }
    }
  }

  // 2. Manejar Arrastre (Drag and Drop)
  onDrop(event: CdkDragDrop<ITask[]>): void { // <-- **MÉTODO onDrop CORREGIDO Y EN SU LUGAR**
    if (event.previousContainer === event.container) {
      // Mover dentro de la misma lista
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      // Mover entre listas diferentes
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

// 3. Eliminar Tarea
  deleteTask(taskToDelete: ITask, listName: 'todo' | 'inProgress' | 'done'): void {
    switch (listName) {
      case 'todo':
        this.todo = this.todo.filter(task => task.id !== taskToDelete.id);
        break;
      case 'inProgress':
        this.inProgress = this.inProgress.filter(task => task.id !== taskToDelete.id);
        break;
      case 'done':
        this.done = this.done.filter(task => task.id !== taskToDelete.id);
        break;
    }
  }

 onUserTaskStatusChanged(event: { taskId: number; newStatus: string }): void {
    const task = this.userTasks.find(t => t.id === event.taskId);
    if (task) {
      task.status = event.newStatus as any;
    }
  }

  onViewTaskDetails(taskId: number): void {
    const task = this.userTasks.find(t => t.id === taskId);
    if (task) {
      alert(`Detalles de la tarea: ${task.title}\n\nDescripción: ${task.description}\n\nEstado: ${task.status}\n\nPaga: $${task.estimatedPay}`);
    }
  }
}

/*
  addTask() {
    if (this.taskForm.valid) {
      const newTitle = this.taskForm.value.title;
      if (newTitle) {
        const newTask: ITask = {
          id: Date.now(), // ID único
          title: newTitle
        };
        // Añade la nueva tarea al inicio de 'todo'
        this.todo.unshift(newTask);
        this.taskForm.reset();
      }
    }
  }

 
  deleteTask(taskToDelete: ITask, listName: 'todo' | 'inProgress' | 'done') {
    switch (listName) {
      case 'todo':
        this.todo = this.todo.filter(task => task.id !== taskToDelete.id);
        break;
      case 'inProgress':
        this.inProgress = this.inProgress.filter(task => task.id !== taskToDelete.id);
        break;
      case 'done':
        this.done = this.done.filter(task => task.id !== taskToDelete.id);
        break;
    }
  }
}*/