import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { MatCardModule } from '@angular/material/card';


import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { MatSelectModule } from '@angular/material/select'; // Nuevo
import { MatDatepickerModule } from '@angular/material/datepicker'; // Nuevo
import { MatNativeDateModule } from '@angular/material/core'; // Necesario para Datepicker

import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';


import { MatIconModule } from '@angular/material/icon';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component'; 


// Definiciones de tipos para evitar errores
export type Priority = 'Alta' | 'Media' | 'Baja';
export type Area = 'INGENIERÍA' | 'LOGÍSTICA' | 'MARKETING';

export interface ITask {
  id: number;
  title: string;
  area: Area;         // Nuevo: Área a la que pertenece
  priority: Priority; // Nuevo: Nivel de prioridad
  dueDate: string;    // Nuevo: Fecha de entrega (formato string 'YYYY-MM-DD')
  estimatedPay: number; // Nuevo: Pago estimado
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
    MatSelectModule,      // Añadir
    MatDatepickerModule,  // Añadir
    MatNativeDateModule,  // Añadir
    UserDashboardComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css' 
})
export class App { 
  protected readonly title = signal('mi-tablero-kanban');
  
  showUserDashboard = false;
  
  private fb = inject(FormBuilder);

  minDate: Date = new Date();

  // Opciones de las listas desplegables para el HTML
  availableAreas: Area[] = ['INGENIERÍA', 'LOGÍSTICA', 'MARKETING'];
  availablePriorities: Priority[] = ['Alta', 'Media', 'Baja'];

  taskForm = this.fb.group({
    title: ['', Validators.required],
    area: [this.availableAreas[0], Validators.required], // Valor inicial: INGENIERÍA
    priority: [this.availablePriorities[0], Validators.required], // Valor inicial: Alta
    dueDate: ['', Validators.required], // Requiere una fecha
    estimatedPay: [0, [Validators.required, Validators.min(0)]] // Pago mínimo 0
  });

 
ingenieria: ITask[] = []; // Reemplaza a 'todo'
logistica: ITask[] = []; // Reemplaza a 'inProgress'
marketing: ITask[] = []; // Reemplaza a 'done'

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
    const { title, area, priority, dueDate } = this.taskForm.value;
    const pay: number = Number(this.taskForm.value.estimatedPay ?? 0);

    if (title && area && priority && dueDate) {
      const newTask: ITask = {
        id: Date.now(),
        title: title,
        area: area as Area,
        priority: priority as Priority,
        dueDate: dueDate,
        estimatedPay: pay
      };

      // *** LÓGICA DE ASIGNACIÓN POR ÁREA ***
      switch (area) {
        case 'INGENIERÍA':
          this.ingenieria.unshift(newTask);
          break;
        case 'LOGÍSTICA':
          this.logistica.unshift(newTask);
          break;
        case 'MARKETING':
          this.marketing.unshift(newTask);
          break;
        default:
          // Si por alguna razón el área no coincide, la pone en Ingeniería
          this.ingenieria.unshift(newTask);
          break;
      }
      // *************************************

      this.taskForm.reset({
          title: '',
          area: this.availableAreas[0],
          priority: this.availablePriorities[0],
          dueDate: '',
          estimatedPay: 0
      });
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
  deleteTask(taskToDelete: ITask, listName: 'ingenieria' | 'logistica' | 'marketing'): void {
  switch (listName) {
    case 'ingenieria':
      this.ingenieria = this.ingenieria.filter(task => task.id !== taskToDelete.id);
      break;
    case 'logistica':
      this.logistica = this.logistica.filter(task => task.id !== taskToDelete.id);
      break;
    case 'marketing':
      this.marketing = this.marketing.filter(task => task.id !== taskToDelete.id);
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