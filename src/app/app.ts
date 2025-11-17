import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common'; 
import { MatCardModule } from '@angular/material/card';


import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

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
  area: Area;         
  priority: Priority; 
  dueDate: string;    
  estimatedPay: number;
  description: string; 
}

// Tipo de unión para todas las 9 listas de tareas (necesario para deleteTask)
type AllLists = 
  | 'ingenieriaAlta' | 'ingenieriaMedia' | 'ingenieriaBaja'
  | 'logisticaAlta' | 'logisticaMedia' | 'logisticaBaja'
  | 'marketingAlta' | 'marketingMedia' | 'marketingBaja';


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
    MatSelectModule,      
    MatDatepickerModule,  
    MatNativeDateModule,  
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
    description: ['', Validators.required],
    area: [this.availableAreas[0], Validators.required],
    priority: [this.availablePriorities[0], Validators.required],
    dueDate: ['', Validators.required],
    estimatedPay: [0, [Validators.required, Validators.min(0)]]
  });

 
// Estructura de Tareas por Prioridad (9 listas)
ingenieriaAlta: ITask[] = [];
ingenieriaMedia: ITask[] = [];
ingenieriaBaja: ITask[] = [];

logisticaAlta: ITask[] = [];
logisticaMedia: ITask[] = [];
logisticaBaja: ITask[] = [];

marketingAlta: ITask[] = [];
marketingMedia: ITask[] = [];
marketingBaja: ITask[] = [];

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
 
// Helper para definir el orden numérico de las prioridades
private getPriorityOrder(priority: Priority | undefined): number {
  switch (priority) {
    case 'Alta':
      return 1; // Primero
    case 'Media':
      return 2;
    case 'Baja':
      return 3; // Último
    default:
      return 99;
  }
}


/**
 * Ordena las tareas: 1. Por Prioridad (Alta a Baja). 2. Por Fecha (más cercana primero).
 */
sortTasks(tasks: ITask[]): void {
  tasks.sort((a, b) => {
    // 1. Criterio Primario: PRIORIDAD
    const orderA = this.getPriorityOrder(a.priority);
    const orderB = this.getPriorityOrder(b.priority);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // 2. Criterio Secundario: FECHA DE ENTREGA (más cercana primero)
    if (a.dueDate < b.dueDate) {
      return -1; 
    }
    if (a.dueDate > b.dueDate) {
      return 1; 
    }

    // 3. Criterio Terciario: Si todo es igual, no cambiar el orden relativo.
    return 0;
  });
}

constructor() {
        this.loadTasks(); // <<-- LLAMADA CLAVE PARA CARGAR DATOS AL INICIO -->>
    }

    // ----------------------------------------------------
    // METODOS DE PERSISTENCIA
    // ----------------------------------------------------

    private saveTasks(): void {
        const allTasks = {
            ingenieriaAlta: this.ingenieriaAlta,
            ingenieriaMedia: this.ingenieriaMedia,
            ingenieriaBaja: this.ingenieriaBaja,
            logisticaAlta: this.logisticaAlta,
            logisticaMedia: this.logisticaMedia,
            logisticaBaja: this.logisticaBaja,
            marketingAlta: this.marketingAlta,
            marketingMedia: this.marketingMedia,
            marketingBaja: this.marketingBaja,
        };
        // Convierte el objeto a string y lo guarda en localStorage
        localStorage.setItem('kanbanTasks', JSON.stringify(allTasks));
    }

    private loadTasks(): void {
        const storedData = localStorage.getItem('kanbanTasks');
        if (storedData) {
            try {
                const tasks = JSON.parse(storedData);
                // Asigna los datos cargados a las listas correspondientes
                this.ingenieriaAlta = tasks.ingenieriaAlta || [];
                this.ingenieriaMedia = tasks.ingenieriaMedia || [];
                this.ingenieriaBaja = tasks.ingenieriaBaja || [];

                this.logisticaAlta = tasks.logisticaAlta || [];
                this.logisticaMedia = tasks.logisticaMedia || [];
                this.logisticaBaja = tasks.logisticaBaja || [];

                this.marketingAlta = tasks.marketingAlta || [];
                this.marketingMedia = tasks.marketingMedia || [];
                this.marketingBaja = tasks.marketingBaja || [];
            } catch (e) {
                console.error("Error al parsear tareas de localStorage", e);
            }
        }
    }


// METODOS PARA EL MANEJO DE TAREAS   

// 1. Agregar Tarea
addTask(): void {
  if (this.taskForm.valid) {
    const { title, description, area, priority, dueDate } = this.taskForm.value;
    const pay: number = Number(this.taskForm.value.estimatedPay ?? 0);

    if (title && description && area && priority && dueDate) {
      const newTask: ITask = {
        id: Date.now(),
        title: title,
        description: description,
        area: area as Area,
        priority: priority as Priority,
        dueDate: dueDate,
        estimatedPay: pay
      };

     // *** LÓGICA DE ASIGNACIÓN POR ÁREA Y PRIORIDAD (CORREGIDA) ***
      
      switch (area) {
        case 'INGENIERÍA':
          switch (priority) {
            case 'Alta': this.ingenieriaAlta.unshift(newTask); break;
            case 'Media': this.ingenieriaMedia.unshift(newTask); break;
            case 'Baja': this.ingenieriaBaja.unshift(newTask); break;
          }
          break; // <<-- Break correcto
        case 'LOGÍSTICA':
          switch (priority) {
            case 'Alta': this.logisticaAlta.unshift(newTask); break;
            case 'Media': this.logisticaMedia.unshift(newTask); break;
            case 'Baja': this.logisticaBaja.unshift(newTask); break;
          }
          break; // <<-- Break correcto
        case 'MARKETING':
          switch (priority) {
            case 'Alta': this.marketingAlta.unshift(newTask); break;
            case 'Media': this.marketingMedia.unshift(newTask); break;
            case 'Baja': this.marketingBaja.unshift(newTask); break;
          }
          break; // <<-- Break correcto
      }
      // *************************************

      this.saveTasks();
    }
  }
} 

  // 2. Manejar Arrastre (Drag and Drop)
  onDrop(event: CdkDragDrop<ITask[]>): void {
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

      // Reordenar la lista de destino después del movimiento
      this.sortTasks(event.container.data);
    }
    this.saveTasks(); // Guardar cambios después del arrastre
}

// 3. Eliminar Tarea
// Usamos el tipo AllLists definido fuera de la clase.
deleteTask(taskToDelete: ITask, listName: AllLists): void {
  // Acceso dinámico a la propiedad de la clase, más limpio que un switch de 9 casos.
  // Es seguro aquí porque 'AllLists' restringe los posibles valores de listName.
  const list = (this as any)[listName] as ITask[];
  
  if (Array.isArray(list)) {
    // Reemplaza la lista por la versión filtrada
    (this as any)[listName] = list.filter((task: ITask) => task.id !== taskToDelete.id);
  }
  this.saveTasks(); // Guarda los cambios después de eliminar
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
    }*/
  

