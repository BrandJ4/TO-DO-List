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
  status: 'asignada' | 'en_proceso' | 'completada'; // <<-- CLAVE PARA SINCRONIZACIÓN
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

  // Configuración del Usuario Activo (Filtrado)
  private readonly ACTIVE_USER_AREA: Area = 'INGENIERÍA'; 
  userName = 'Juan García'; 
  userArea = this.ACTIVE_USER_AREA; 

  // Eliminamos userTasks, ahora usamos getUserTasks()

  constructor() {
    this.loadTasks(); 
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
    localStorage.setItem('kanbanTasks', JSON.stringify(allTasks));
  }

  private loadTasks(): void {
    const storedData = localStorage.getItem('kanbanTasks');
    if (storedData) {
      try {
        const tasks = JSON.parse(storedData);
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

  // ----------------------------------------------------
  // METODOS DE UTILIDAD Y VISTAS
  // ----------------------------------------------------

  /**
  * Recolecta todas las tareas de las 9 listas en una sola lista.
  */
  private getAllTasks(): ITask[] {
    return [
      ...this.ingenieriaAlta, ...this.ingenieriaMedia, ...this.ingenieriaBaja,
      ...this.logisticaAlta, ...this.logisticaMedia, ...this.logisticaBaja,
      ...this.marketingAlta, ...this.marketingMedia, ...this.marketingBaja,
    ];
  }

  /**
  * Filtra las tareas del tablero para pasarlas al dashboard del usuario.
  */
  getUserTasks(): ITask[] {
    const allTasks = this.getAllTasks();
    return allTasks.filter(task => task.area === this.ACTIVE_USER_AREA);
  }
  
  // Helper para definir el orden numérico de las prioridades
  private getPriorityOrder(priority: Priority | undefined): number {
    switch (priority) {
      case 'Alta': return 1;
      case 'Media': return 2;
      case 'Baja': return 3;
      default: return 99;
    }
  }

  // Ordena las tareas
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
      return 0;
    });
  }

  // Métodos para mostrar el estado en el tablero Admin
  getStatusIcon(status: ITask['status']): string {
    switch (status) {
      case 'asignada': return 'assignment';
      case 'en_proceso': return 'schedule';
      case 'completada': return 'check_circle';
      default: return 'help';
    }
  }

  getStatusLabel(status: ITask['status']): string {
    switch (status) {
      case 'asignada': return 'Asignada';
      case 'en_proceso': return 'En Proceso';
      case 'completada': return 'Completada';
      default: return status;
    }
  }

  // ----------------------------------------------------
  // METODOS DE MANEJO DE TAREAS 
  // ----------------------------------------------------

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
          estimatedPay: pay,
          status: 'asignada' // Estado inicial para el trabajador
        };

        // LÓGICA DE ASIGNACIÓN POR ÁREA Y PRIORIDAD
        switch (area) {
          case 'INGENIERÍA':
            switch (priority) {
              case 'Alta': this.ingenieriaAlta.unshift(newTask); break;
              case 'Media': this.ingenieriaMedia.unshift(newTask); break;
              case 'Baja': this.ingenieriaBaja.unshift(newTask); break;
            }
            break;
          case 'LOGÍSTICA':
            switch (priority) {
              case 'Alta': this.logisticaAlta.unshift(newTask); break;
              case 'Media': this.logisticaMedia.unshift(newTask); break;
              case 'Baja': this.logisticaBaja.unshift(newTask); break;
            }
            break;
          case 'MARKETING':
            switch (priority) {
              case 'Alta': this.marketingAlta.unshift(newTask); break;
              case 'Media': this.marketingMedia.unshift(newTask); break;
              case 'Baja': this.marketingBaja.unshift(newTask); break;
            }
            break;
        }

        this.saveTasks(); // Persistencia
        
        // Resetear el formulario
        this.taskForm.reset({
            title: '',
            description: '',
            area: this.availableAreas[0],
            priority: this.availablePriorities[0],
            dueDate: '',
            estimatedPay: 0
        });
      }
    }
  } 

  // 2. Manejar Arrastre (Drag and Drop)
  onDrop(event: CdkDragDrop<ITask[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      this.sortTasks(event.container.data);
    }
    this.saveTasks(); // Persistencia
  }

  // 3. Eliminar Tarea
  deleteTask(taskToDelete: ITask, listName: AllLists): void {
    const list = (this as any)[listName] as ITask[];
    
    if (Array.isArray(list)) {
      (this as any)[listName] = list.filter((task: ITask) => task.id !== taskToDelete.id);
    }
    this.saveTasks(); // Persistencia
  }
  
  // 4. SINCRONIZACIÓN: Cambiar estado desde el dashboard del usuario (Worker)
  onUserTaskStatusChanged(event: { taskId: number; newStatus: ITask['status'] }): void {
    const { taskId, newStatus } = event;
    
    const listNames: AllLists[] = [
        'ingenieriaAlta', 'ingenieriaMedia', 'ingenieriaBaja',
        'logisticaAlta', 'logisticaMedia', 'logisticaBaja',
        'marketingAlta', 'marketingMedia', 'marketingBaja'
    ];

    let foundTask: ITask | undefined;

    for (const listName of listNames) {
        const list: ITask[] = (this as any)[listName];
        foundTask = list.find(task => task.id === taskId);
        
        if (foundTask) {
            foundTask.status = newStatus;
            break; 
        }
    }
    // Si la tarea se encontró y actualizó, guardamos el estado de todo el tablero
    if (foundTask) {
        this.saveTasks();
    }
  }

  // 5. Ver detalles (solo como ejemplo)
  onViewTaskDetails(taskId: number): void {
    const task = this.getAllTasks().find(t => t.id === taskId);
    if (task) {
      alert(`Detalles de la tarea: ${task.title}\nDescripción: ${task.description}\nEstado: ${this.getStatusLabel(task.status)}\nPaga: S/ ${task.estimatedPay}`);
    }
  }
}

