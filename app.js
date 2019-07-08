const {
    dialog,
    app,
    BrowserWindow
} = require('electron');

const fs = require('fs');
const path = require('path');
const url = require('url');

let win;
let x = 10;


function createWindow() {
    app.commandLine.appendSwitch('--autoplay-policy', 'no-user-gesture-required');
    // Crear ventana navegador
    var iconPath = path.join(__dirname, "assets", "Shoko.png");
    win = new BrowserWindow({
        width: 800,
        height: 600,
        icon: iconPath,
        nodeIntegration: true,
        show: false
    })

    // Cargar index html
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    // Activar DevTools
    win.webContents.openDevTools();

    // Desactivar opciones por defecto de ventana
    win.setMenu(null)

    // ---

    win.on('closed', () => {
        win = null;
    });
    
    win.setMinimumSize(600, 400);
    win.setContentProtection(true);
    // Forzar pantalla completa
    //win.setFullScreen(true);

    // Opacidad de 0 a 99 [experimental]
    /*var count = 0;
    setInterval(() => {
        if(count<100){
            win.setOpacity(count/100);
            count+=1;
        } else {
            clearInterval();
        }
    }, 10);*/
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    app.quit();
});