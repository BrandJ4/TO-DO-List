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
    MatIconModule 
  ],
  templateUrl: './app.html',
  styleUrl: './app.css' 
})
export class App { 
  protected readonly title = signal('mi-tablero-kanban'); 
  
  private fb = inject(FormBuilder);

  
  taskForm = this.fb.group({
    title: ['', Validators.required]
  });

 
  todo: ITask[] = [
    
  ];

  inProgress: ITask[] = [];

  done: ITask[] = [
    
  ];
Tarea: unknown;

 
  onDrop(event: CdkDragDrop<ITask[]>) {
    if (event.previousContainer === event.container) {
      // Mover en la misma lista
      moveItemInArray(
        event.container.data, 
        event.previousIndex, 
        event.currentIndex
      );
    } else {
     
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  
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
}