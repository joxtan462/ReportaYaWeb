import { Component, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UsuarioService } from './servicios/usuario.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  protected readonly title = signal('reporta-ya');

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit() {
  }
}