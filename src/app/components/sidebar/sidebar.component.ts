import { Component } from '@angular/core';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { FormsModule } from '@angular/forms';
import { NzListModule } from 'ng-zorro-antd/list';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NzAutocompleteModule, FormsModule, NzListModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  inputValue?: string;
  users: string[] = [];

  data = [
    {
      name: 'Tonči Marinac'
    },
    {
      name: 'Dominik Bedenic'
    },
    {
      name: 'Babić Babinjo'
    },
  ];

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.users = value ? [value, value + value, value + value + value] : [];
  }


}
