import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx'; // Se agregó la importación de SQLite y SQLiteObject
import { Platform, ToastController } from '@ionic/angular'; // Se agregó la importación de Platform y ToastController
import { BehaviorSubject, Observable } from 'rxjs'; // Se agregó la importación de BehaviorSubject y Observable
import { Noticias } from './noticias'; // Se agregó la importación del modelo Noticias

@Injectable({
  providedIn: 'root'
})
export class DbserviceService {
  public database!: SQLiteObject; // Se agregó la propiedad database de tipo SQLiteObject

  tablaNoticias: string = "CREATE TABLE IF NOT EXISTS noticia(id INTEGER PRIMARY KEY autoincrement, titulo VARCHAR(50) NOT NULL, texto TEXT NOT NULL);"; // Se agregó la definición de la tabla de noticias
  registro: string = "INSERT or IGNORE INTO noticia(id, titulo, texto) VALUES (1, 'Titulo noticia', 'Texto de la noticia que se quiere mostrar');"; // Se agregó un registro de ejemplo
  listaNoticias = new BehaviorSubject<Noticias[]>([]); // Se agregó un BehaviorSubject para manejar la lista de noticias

  private isDbReady: BehaviorSubject<boolean> = new BehaviorSubject(false); // Se agregó un BehaviorSubject para indicar si la BD está lista
  constructor(private sqlite: SQLite, private platform: Platform, public toastController: ToastController) { // Se modificó el constructor para incluir SQLite, Platform y ToastController
    this.crearBD(); // Se llama a crearBD desde el constructor

  }

  addNoticia(titulo: string, texto: string) {
    let data = [titulo, texto];
    return this.database.executeSql('INSERT INTO noticia(titulo, texto) VALUES(?, ?)', data)
      .then(res => {
        this.buscarNoticias();
      });
  }
  
  updateNoticia(id: number, titulo: string, texto: string) {
    let data = [titulo, texto, id];
    return this.database.executeSql('UPDATE noticia SET titulo = ?, texto = ? WHERE id = ?', data)
      .then(data2 => {
        this.buscarNoticias();
      });
  }
  
  deleteNoticia(id: number) {
    return this.database.executeSql('DELETE FROM noticia WHERE id = ?', [id])
      .then(a => {
        this.buscarNoticias();
      });
  }

  dbState() { // Se agregó el método dbState para obtener el estado de la BD
    return this.isDbReady.asObservable();
  }

  crearBD() { // Se agregó el método crearBD para crear la base de datos
    this.platform.ready().then(() => {
      this.sqlite.create({
        name: 'noticias3.db',
        location: 'default'

      }).then((db: SQLiteObject) => {
        this.database = db;
        this.presentToast("BD Creada");
        //llamamos a la creación de tablas
        this.crearTablas();
      }).catch(e => this.presentToast(e));
    })
  }

  async crearTablas() { // Se agregó el método crearTablas para crear las tablas necesarias
    try {
      await this.database.executeSql(this.tablaNoticias, []);
      await this.database.executeSql(this.registro, []);
      this.presentToast("Tabla Creada");
      this.buscarNoticias();
      this.isDbReady.next(true);
    } catch (e) {
      this.presentToast("error creartabla " + e);
    }
  }

  buscarNoticias() { // Se agregó el método buscarNoticias para buscar noticias en la BD
    return this.database.executeSql('SELECT * FROM noticia', []).then(res => {
      let items: Noticias[] = [];
      if (res.rows.length > 0) {
        for (var i = 0; i < res.rows.length; i++) {
          items.push({
            id: res.rows.item(i).id,
            titulo: res.rows.item(i).titulo,
            texto: res.rows.item(i).texto
          });
        }
      }
      this.listaNoticias.next(items);
    });
  }

  fetchNoticias(): Observable<Noticias[]> { // Se agregó el método fetchNoticias para obtener las noticias como un Observable
    return this.listaNoticias.asObservable();
  }

  async presentToast(mensaje: string) { // Se agregó el método presentToast para mostrar mensajes
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000
    });
    toast.present();
  }

}