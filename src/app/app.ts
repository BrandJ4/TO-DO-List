import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterOutlet, Router, ActivatedRoute } from '@angular/router'; // Importaciones de Router
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { UserDashboardComponent, UserTask } from './user-dashboard/user-dashboard.component'; // Importar UserDashboard
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// --- Definiciones de Tipos ---
export type Priority = 'Alta' | 'Media' | 'Baja';
export type Area = 'INGENIERÍA' | 'LOGÍSTICA' | 'MARKETING';

export interface ITask {
  id: number;
  title: string;
  description: string;
  area: Area;
  priority: Priority;
  status: 'asignada' | 'en_proceso' | 'completada';
  dueDate: string;
  estimatedPay: number;
}

export interface ITaskStatusChangedEvent {
  taskId: number;
  newStatus: UserTask['status'];
}
// -----------------------------

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet, // Necesario para mostrar el login/dashboard
    ReactiveFormsModule,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CdkDrag,
    CdkDropList,
    UserDashboardComponent,
    MatSnackBarModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit { // <-- CLASE NOMBRADA COMO 'App'
  
  // --- PROPIEDADES DE ESTADO DE AUTENTICACIÓN ---
  isLoggedIn: boolean = false;
  userRole: 'admin' | 'worker' | null = null;
  userName: string = '';
  userArea: Area = 'INGENIERÍA';
  // ------------------------------------------------

  title = 'kanban-app';
  taskForm: FormGroup;
  minDate: Date = new Date();

  // Listas para el Kanban
  availableAreas: Area[] = ['INGENIERÍA', 'LOGÍSTICA', 'MARKETING'];
  availablePriorities: Priority[] = ['Alta', 'Media', 'Baja'];
  tasks: ITask[] = [];

  // Listas de Kanban (Filtradas)
  ingenieriaAlta: ITask[] = [];
  ingenieriaMedia: ITask[] = [];
  ingenieriaBaja: ITask[] = [];

  logisticaAlta: ITask[] = [];
  logisticaMedia: ITask[] = [];
  logisticaBaja: ITask[] = [];

  marketingAlta: ITask[] = [];
  marketingMedia: ITask[] = [];
  marketingBaja: ITask[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router, // Inyección de Router para navegación
    private route: ActivatedRoute, // Inyección de ActivatedRoute para leer parámetros
    private snackBar: MatSnackBar
  ) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      area: ['INGENIERÍA', Validators.required],
      priority: ['Media', Validators.required],
      dueDate: ['', Validators.required],
      estimatedPay: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.loadTasks(); 

    // Suscribe al cambio de query params (Role, Nombre, Área)
    this.route.queryParams.subscribe(params => {
      const role = params['role'] as 'admin' | 'worker';
      
      if (role) {
        this.isLoggedIn = true;
        this.userRole = role;
        
        // Cargar detalles si es trabajador
        if (role === 'worker') {
          this.userName = params['name'] || 'Trabajador';
          this.userArea = params['area'] as Area || 'INGENIERÍA';
        }
      } else {
        // Redirige al login si intenta ir a /dashboard sin rol definido
        if (this.router.url.includes('/dashboard')) {
            this.router.navigate(['/login']);
        }
      }
      this.filterTasks();
    });
  }

  // --- FUNCIÓN DE LOGOUT ---
  /**
   * Cierra la sesión del usuario, limpia el rol y redirige al login.
   */
  logout(): void {
    this.isLoggedIn = false;
    this.userRole = null;
    this.router.navigate(['/login']);
  }
  // -------------------------

  // --- Lógica del Kanban y Tareas ---

  /**
   * Filtra las tareas en las listas de Kanban por Área y Prioridad.
   */
  filterTasks(): void {
    // 1. Limpiar todas las listas
    this.ingenieriaAlta = []; this.ingenieriaMedia = []; this.ingenieriaBaja = [];
    this.logisticaAlta = []; this.logisticaMedia = []; this.logisticaBaja = [];
    this.marketingAlta = []; this.marketingMedia = []; this.marketingBaja = [];

    // 2. Repartir las tareas
    this.tasks.forEach(task => {
      if (task.area === 'INGENIERÍA') {
        if (task.priority === 'Alta') this.ingenieriaAlta.push(task);
        else if (task.priority === 'Media') this.ingenieriaMedia.push(task);
        else if (task.priority === 'Baja') this.ingenieriaBaja.push(task);
      } else if (task.area === 'LOGÍSTICA') {
        if (task.priority === 'Alta') this.logisticaAlta.push(task);
        else if (task.priority === 'Media') this.logisticaMedia.push(task);
        else if (task.priority === 'Baja') this.logisticaBaja.push(task);
      } else if (task.area === 'MARKETING') {
        if (task.priority === 'Alta') this.marketingAlta.push(task);
        else if (task.priority === 'Media') this.marketingMedia.push(task);
        else if (task.priority === 'Baja') this.marketingBaja.push(task);
      }
    });
    this.saveTasks();
  }

  /**
   * Agrega una nueva tarea al listado maestro.
   */
  addTask(): void {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.value;
      const newTask: ITask = {
        id: new Date().getTime(), // ID único basado en timestamp
        title: formValue.title,
        description: formValue.description,
        area: formValue.area as Area,
        priority: formValue.priority as Priority,
        status: 'asignada', // Siempre inician como asignadas
        dueDate: formValue.dueDate.toISOString().split('T')[0], // Formato 'YYYY-MM-DD'
        estimatedPay: formValue.estimatedPay,
      };

      this.tasks.push(newTask);
      this.taskForm.reset({
        area: 'INGENIERÍA',
        priority: 'Media',
        estimatedPay: 0,
      });
      this.filterTasks();
      this.snackBar.open('Tarea agregada exitosamente!', 'Cerrar', { duration: 3000, panelClass: ['success-snackbar'] });
    }
  }

  /**
   * Elimina una tarea del listado maestro.
   */
  deleteTask(task: ITask, listName: string): void {
    this.tasks = this.tasks.filter(t => t.id !== task.id);
    this.filterTasks();
    this.snackBar.open(`Tarea "${task.title}" eliminada.`, 'Cerrar', { duration: 3000 });
  }

  /**
   * Maneja el evento de soltar (drop) del CdkDragDrop.
   */
  onDrop(event: CdkDragDrop<ITask[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
    this.updateTaskAfterDrop(event.container.data[event.currentIndex]);
    this.saveTasks();
  }

  /**
   * Actualiza el área y prioridad de la tarea movida después de un drop.
   */
  updateTaskAfterDrop(task: ITask): void {
    // La clave es determinar a qué lista pertenece el item después de ser movido
    const listReference = this.getContainerNameByList(task.area, task.priority);
    
    // Simplificación para determinar la nueva Área
    const newArea = listReference.startsWith('ingenieria') ? 'INGENIERÍA' :
                    listReference.startsWith('logistica') ? 'LOGÍSTICA' : 'MARKETING';

    // Simplificación para determinar la nueva Prioridad
    const newPriority = listReference.endsWith('Alta') ? 'Alta' :
                        listReference.endsWith('Media') ? 'Media' : 'Baja';
    
    // Actualizar el objeto ITask en la lista maestra
    const index = this.tasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
      this.tasks[index].area = newArea as Area;
      this.tasks[index].priority = newPriority as Priority;
    }
  }

  /**
   * Genera el nombre de referencia del contenedor.
   */
  getContainerNameByList(area: Area, priority: Priority): string {
    return `${area.toLowerCase()}${priority}`;
  }

  // --- Funciones para el Trabajador (User Dashboard) ---

  /**
   * Filtra las tareas que corresponden al área del trabajador logueado.
   */
  getUserTasks(): UserTask[] {
    return this.tasks
      .filter(task => task.area === this.userArea)
      .map(task => ({
        id: task.id,
        title: task.title,
        area: task.area,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        estimatedPay: task.estimatedPay,
        description: task.description
      }));
  }

  /**
   * Maneja el cambio de estado de una tarea emitido por el UserDashboard.
   */
  onUserTaskStatusChanged(event: ITaskStatusChangedEvent): void {
    const taskIndex = this.tasks.findIndex(t => t.id === event.taskId);
    if (taskIndex !== -1) {
      this.tasks[taskIndex].status = event.newStatus;
      this.saveTasks();
      this.filterTasks(); // Refresca las listas si el Admin está viendo
      this.snackBar.open(`Tarea #${event.taskId} cambiada a: ${this.getStatusLabel(event.newStatus)}.`, 'Cerrar', { duration: 3000 });
    }
  }

  /**
   * Muestra un snackbar con la descripción completa de la tarea.
   */
  onViewTaskDetails(taskId: number): void {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      // Usar un snackbar como modal simple para mostrar los detalles.
      this.snackBar.open(`Detalles de: ${task.title}. Descripción: ${task.description}`, 'Cerrar', { duration: 5000 });
    }
  }

  // --- Funciones Helper y Persistencia ---
  
  getStatusLabel(status: 'asignada' | 'en_proceso' | 'completada'): string {
    switch (status) {
      case 'asignada': return 'Asignada';
      case 'en_proceso': return 'En Proceso';
      case 'completada': return 'Completada';
      default: return status;
    }
  }

  getStatusIcon(status: 'asignada' | 'en_proceso' | 'completada'): string {
    switch (status) {
      case 'asignada': return 'assignment';
      case 'en_proceso': return 'schedule';
      case 'completada': return 'check_circle';
      default: return 'help';
    }
  }

  /**
   * Guarda las tareas en el LocalStorage.
   */
  saveTasks(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
  }

  /**
   * Carga las tareas desde el LocalStorage.
   */
  loadTasks(): void {
    if (typeof localStorage !== 'undefined') {
      const savedTasks = localStorage.getItem('tasks');
      if (savedTasks) {
        this.tasks = JSON.parse(savedTasks);
      }
    }
  }
}

