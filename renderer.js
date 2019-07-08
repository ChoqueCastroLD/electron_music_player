const {
    remote
} = require('electron');
const {
    dialog
} = remote;

const win = remote.getCurrentWindow();

const fs = require('fs');
const path = require('path');

var cancionesGuardadasRuta = path.join(__dirname, "assets", "savedSongs.json");

var canciones;
var playingIndex = 0;

// Capturar elementos HTML
const songList = document.getElementById('songs');
const player = document.getElementById('player');
const playingText = document.getElementById('test');
const volumeChange = document.getElementById('volumeChange');
const volumen = document.getElementById('volumen');
const velocidadChange = document.getElementById('velocidadChange');
const velocidad = document.getElementById('velocidad');
const modo = document.getElementById('modo');
const fullscreen = document.getElementById('fullscreen');
const currentTime = document.getElementById('currentTime')
const totalTime = document.getElementById('totalTime')
const timeline = document.getElementById('timeline')
const play = document.getElementById('play')
const letra = document.getElementById("letra");

const formatosValidos = [".m4a", ".mp3", ".wav", ".aac", ".ogg", ".ac3", ".flac", ".ape", ".mka", ".wma"];

timeline.isMouseOver = false;
timeline.value = 0;
var datosLetra = "";

var historialIndex = [0];


letra.innerHTML = " "

var cargarbtn = document.getElementById('cargar');
cargarbtn.addEventListener('click', () => {
    selectSongs();
})

function reproducirSiguiente(){
    player.currentTime = player.duration;
}

function reproducirAnterior() {
    if (canciones[historialIndex[historialIndex.length - 1]]) {
        var index = historialIndex[historialIndex.length - 1];
        var preSource = player.src;
        var prePlayingIndex = playingIndex;

        playingText.innerHTML = canciones[index].songName;
        player.src = canciones[index].songPath;
        playingIndex = index;

        if (document.readyState == "complete" && player.src != "") {
            player.play().catch((r) => {
                player.src = preSource;
                playingIndex = prePlayingIndex;
                removerCancionPorIndex(index);
            }).then(() => {
                actualizarListaHTML();
            });
        }
        if (historialIndex.length > 1) historialIndex.pop();
    }
}

function reproducirCancion(nombre) {
    var found = false;
    var cancionIndex;
    var preSource = player.src;
    var prePlayingIndex = playingIndex;
    canciones.forEach((song, i) => {
        if (song.songName.toString().localeCompare(nombre) == 0) {
            playingText.innerHTML = song.songName;
            player.src = song.songPath;
            playingIndex = i;
            found = true;
            cancionIndex = i;
        }
    });
    if (document.readyState == "complete" && player.src != "") {
        var error = false;
        player.play().catch((r) => {
            player.src = preSource;
            playingIndex = prePlayingIndex;
            error = true;
        }).then(() => {
            if (found) {
                if (error) {
                    removerCancionPorIndex(cancionIndex);
                } else {
                    historialIndex.push(prePlayingIndex);
                }
            } else {
                player.src = preSource;
                playingIndex = prePlayingIndex;
                dialog.showErrorBox("Alerta", "La cancion que intentas reproducir no ha sido cargada correctamente!");
            }
            actualizarListaHTML();
        });
    }
}

function removerCancionPorIndex(cancionIndex) {
    playingIndex = 0;
    var newJson = canciones.splice(cancionIndex, 1);
    newJson = JSON.stringify({
        songs: canciones
    });
    fs.writeFileSync(cancionesGuardadasRuta, newJson);
    if (canciones.length > 0) {
        reproducirCancion(canciones[0].songName);
    } else {
        actualizarListaHTML();
    }
}

function abrirOpciones(cancionIndex) {

}

function removerCancionPorIndexNicely(cancionIndex) {
    var res = dialog.showMessageBox(win, {
        "message": "Estas seguro? Se eliminara la canción " + canciones[cancionIndex].songName,
        "buttons": ["Aceptar", "Cancelar"],
        "title": "Confirmar Accion",
        "type": "question",
        "detail": "No se eliminará ningun archivo, solo se removera de la lista."
    })
    if (res == 0) {
        var name = canciones[cancionIndex].songName;
        removerCancionPorIndex(cancionIndex);
        M.toast({
            html: 'Cancion Removida: ' + name,
            classes: 'data-position'
        });
    }
}

function reproducirRandom() {
    var nextIndex = 0;
    if (canciones.length > 1) {
        do {
            nextIndex = parseInt(Math.floor(Math.random() * canciones.length));
        } while (nextIndex == playingIndex);
    }
    reproducirCancion(canciones[nextIndex].songName);
}

function borrarTodasCanciones() {
    var res = dialog.showMessageBox(win, {
        "message": "Se eliminaran todas tus canciones de la lista",
        "buttons": ["Aceptar", "Cancelar"],
        "title": "Confirmar Accion",
        "type": "question",
        "detail": "No se eliminará ningun archivo, solo se removeran de la lista."
    })
    if (res == 0) {
        if (canciones.length > 0) {
            player.pause();
            while (canciones.length > 0) removerCancionPorIndex(canciones.length - 1);
            M.toast({
                html: 'Se han eliminado todas tus canciones'
            });
        } else {
            M.toast({
                html: 'No hay canciones que eliminar'
            });
        }
    }
}

function actualizarListaHTML() {
    songList.innerHTML = "";
    canciones.forEach((song, i) => {
        if (fs.existsSync(song.songPath)) {
            var header = '<div href="#!" class="collapsible-header" onclick="reproducirCancion(\'' + sanitazeSimpleQuote(song.songName) + '\');"><span class="title cyan-text">' + sanitazeSimpleQuote(song.songName) + '</span></div>';
            var btn1 = '<a class="btn-floating btn-small waves-effect waves-light modal-trigger" href="#modal1""><i class="material-icons">more</i></a>'
            var btn2 = '<a class="btn-floating btn-small waves-effect waves-light red" onclick="removerCancionPorIndexNicely(' + i + ');"><i class="material-icons">delete</i></a>'
            var body = '<div class="collapsible-body"><div class="row"><div class="col s6"><center>' + btn1 + '</center></div><div class="col s6"><center>' + btn2 + '</center></div></div></div>'
            var li = '<li class="cancionLI" data-songName="' + sanitazeSimpleQuote(song.songName) + '">' + header + body + '</li>'
            songList.innerHTML += li;
        } else {
            removerCancionPorIndex(i);
            return 0;
        }
    });
    var instance = M.Collapsible.getInstance(songList);
    instance.open(playingIndex);
    if (canciones.length == 0) {
        songList.innerHTML = 'Parece que no haz añadido ninguna canción, Añade unas cuantas dandole al boton + o desde la pestaña Opciones';
        playingText.innerHTML = "Añade una canción usando el panel de la izquierda para comenzar."
        player.pause();
        player.src = "";
    }
}

function sanitazeSimpleQuote(string) {
    var ret = string;
    var overload = 0;
    while (ret.includes("'")) {
        ret = ret.replace("'", "{SimpleQuoteToken}");
        overload++;
        if (overload >= 1000) break;
    }
    overload = 0;
    while (ret.includes("{SimpleQuoteToken}")) {
        ret = ret.replace("{SimpleQuoteToken}", "\\'");
        overload++;
        if (overload >= 1000) break;
    }
    return ret;
}

function actualizarLista() {
    fs.readFile(cancionesGuardadasRuta, (err, data) => {
        if (err) {
            console.log("Parece que no tienes ninguna cancion, deberias añadir unas cuantas a tu lista!");
        } else {
            canciones = JSON.parse(data).songs;
            actualizarListaHTML();
        }
    });
}

function addSong(ruta) {
    fs.readFile(ruta, (err) => {
        if (err) {
            dialog.showErrorBox("Error", err.toString());
        } else {
            fs.readFile(cancionesGuardadasRuta, (er, data) => {
                var ext = path.extname(ruta).toLocaleLowerCase();
                var songName = path.basename(ruta, ext);
                if (formatosValidos.includes(ext)) {
                    if (er) {
                        var toSave = {
                            songs: [{
                                songName: songName,
                                songPath: ruta
                            }]
                        };
                        fs.writeFileSync(cancionesGuardadasRuta, JSON.stringify(toSave));
                        actualizarLista();
                    } else {
                        var savedSongs = JSON.parse(data.toString());
                        var newSong = {
                            songName: songName,
                            songPath: ruta
                        };
                        var duplicado = false;
                        savedSongs.songs.forEach((savedSong) => {
                            if (savedSong.songName == songName) duplicado = true;
                        })
                        if (!duplicado) {
                            savedSongs.songs.push(newSong);
                            fs.writeFileSync(cancionesGuardadasRuta, JSON.stringify(savedSongs));
                            actualizarLista();
                        } else {
                            dialog.showErrorBox("Error", "La cancion '" + songName + "' ya se encuentra en tu lista.");
                        }
                    }
                } else {
                    dialog.showErrorBox("Error", "La cancion '" + songName + "' tiene un formato incompatible.");
                }
            })
        }
    })

}

function selectSongs() {
    dialog.showOpenDialog(win, {
        title: "Selecciona una o mas Canciones",
        buttonLabel: "Añadir a mi Lista",
        properties: ["multiSelections", "openFile"]
    }, (rutas) => {
        if (rutas) {
            if (rutas.length >= 0) {
                rutas.forEach(ruta => {
                    addSong(ruta);
                });
            }
        }
    })
}

function cambiarVelocidad() {
    velocidadChange.innerHTML = 'exposure_zero';
    var speed = 1;
    var vel = parseInt(velocidad.value);
    if (vel) {
        if (vel == 0) {
            speed = 1;
        }
        if (vel == -1) {
            velocidadChange.innerHTML = 'exposure_neg_1';
            speed = 0.6;
        }
        if (vel == 1) {
            velocidadChange.innerHTML = 'exposure_plus_1';
            speed = 1.5;
        }
    }
    player.playbackRate = parseFloat(speed);

}

// Milisegundos a minuto:segundos Ej: 154 >> "2:24"
function formatMS(ms) {
    var ret = (Math.floor(ms / 60)) + ":" + (Math.floor(ms % 60).toFixed(0).length == 1 ? "0" : "") + Math.floor(ms % 60);
    if (ret.includes("NaN")) {
        return "0:00"
    } else {
        return ret;
    }
}

function actualizarLetra() {
    datosLetra = "";
    if (canciones[playingIndex]) {
        fs.readFile(path.join(__dirname, "music", canciones[playingIndex].songName + ".json"), (err, data) => {
            if (err) {
                dadatosLetratos = "";
                return 1;
            } else {
                try {
                    datosLetra = JSON.parse(data.toString());
                    /*console.log("Letra por: " + datos.author)
                    console.log("Cancion: " + datos.song)
                    console.log("Idioma: " + datos.lang)*/
                } catch (e) {
                    datosLetra = "";
                }
            }
        });
    }
}

function mostrarLetra() {
    letra.innerHTML = "";
    if (datosLetra != "") {
        try {
            if (datosLetra.letra) {
                var index;
                var lastStart = 0;
                for (let i = 0; i < datosLetra.letra.length; i++) {
                    const linea = datosLetra.letra[i];
                    if (parseFloat(linea.start) <= parseFloat(player.currentTime) && lastStart < parseFloat(linea.start)) {
                        index = i;
                    }
                    lastStart = parseFloat(linea.start);
                }
                letra.innerHTML = datosLetra.letra[index].txt;
            }
        } catch (e) {
            letra.innerHTML = "";
        }
    }
}

modo.addEventListener("click", () => {
    var valor = modo.getAttribute('data-value');
    if (valor == "aleatorio") {
        modo.setAttribute('data-value', "repetir cancion");
        modo.src = "assets/repetircancion.png";
    } else if (valor == "repetir cancion") {
        modo.setAttribute('data-value', "repetir lista");
        modo.src = "assets/repetirlista.png";
    } else {
        modo.setAttribute('data-value', "aleatorio");
        modo.src = "assets/random.png";
    }
})

fullscreen.addEventListener('click', () => {
    if (fullscreen.getAttribute("data-value") == "Maximizar") {
        fullscreen.setAttribute("data-value", "Minimizar");
        fullscreen.src = "assets/minimizar.png";
        win.setFullScreen(true);
    } else {
        fullscreen.setAttribute("data-value", "Maximizar");
        fullscreen.src = "assets/maximizar.png";
        win.setFullScreen(false);
    }
})

player.addEventListener("ended", () => {
    var nextIndex = 0;
    var valor = modo.getAttribute('data-value').toLowerCase();
    if (valor == "aleatorio") {
        if (canciones.length > 1) {
            do {
                nextIndex = parseInt(Math.floor(Math.random() * canciones.length));
            } while (nextIndex == playingIndex);
        } else {
            nextIndex = 0;
        }
    } else if (valor == "repetir cancion") {
        nextIndex = playingIndex;
    } else {
        nextIndex = (playingIndex + 1 < canciones.length) ? playingIndex + 1 : 0;
    }
    reproducirCancion(canciones[nextIndex].songName);
})
player.addEventListener('durationchange', () => {
    actualizarLetra();
    win.setProgressBar(parseFloat(parseInt((player.currentTime / player.duration) * 100) / 100));
    timeline.value = 0;
    timeline.max = player.duration;
    totalTime.innerHTML = formatMS(player.duration);
    if (canciones[playingIndex]) win.setTitle("jSong - " + canciones[playingIndex].songName);
})

player.addEventListener('timeupdate', () => {
    cambiarVelocidad();
    try {
        player.volume = volumen.value / volumen.max;
        if (player.volume >= 0.5) {
            volumeChange.innerHTML = 'volume_up';
        } else if (player.volume >= 0.15) {
            volumeChange.innerHTML = 'volume_down';
        } else if (player.volume >= 0.001) {
            volumeChange.innerHTML = 'volume_mute';
        } else {
            volumeChange.innerHTML = 'volume_off';
        }
    } catch (e) {
        player.volume = 1;
    }
    currentTime.innerHTML = formatMS(timeline.value);
    if (!timeline.isMouseOver) {
        timeline.value = ((player.currentTime / player.duration) * timeline.max);
    }
    mostrarLetra();
});
player.addEventListener('play', () => {
    play.setAttribute("data-value", "Pausar");
    play.setAttribute("alt", "Pausar");
    play.src = "assets/pause.png";
})
player.addEventListener('pause', () => {
    play.setAttribute("data-value", "Reproducir");
    play.setAttribute("alt", "Reproducir");
    play.src = "assets/play.png";
})
play.addEventListener('click', () => {
    if (play.getAttribute("data-value") == "Reproducir") {
        player.play().catch(() => {
            console.log("No se puede reproducir porque no hay una cancion correctamente cargada")
        });
        play.setAttribute("data-value", "Pausar");
        play.setAttribute("alt", "Pausar");
        play.src = "assets/pause.png";
    } else {
        player.pause();
        play.setAttribute("data-value", "Reproducir");
        play.setAttribute("alt", "Reproducir");
        play.src = "assets/play.png";
    }
})
timeline.addEventListener('mousedown', () => {
    timeline.isMouseOver = true;
    player.pause();
})
timeline.addEventListener('mousemove', () => {
    if (timeline.isMouseOver) {
        currentTime.innerHTML = formatMS(timeline.value);
    }
})
timeline.addEventListener('mouseup', () => {
    timeline.isMouseOver = false;
    player.play().catch(() => {
        console.log("nope")
    })
})
timeline.addEventListener('change', () => {
    if (!isNaN((timeline.value / timeline.max) * player.duration)) {
        player.currentTime = ((timeline.value / timeline.max) * player.duration);
    } else {
        player.currentTime = 0;
    }
})


// DEBUG - Añadir Letra a JSON
const addLetra = document.getElementById('addLetra');
const newLetra = document.getElementById('newLetra');
const remove = document.getElementById('remove');
const edit = document.getElementById('edit');
edit.addEventListener("click", () => {
    var index;
    for (let i = 0; i < datosLetra.letra.length; i++) {
        const linea = datosLetra.letra[i];
        if (parseFloat(linea.start) <= parseFloat(player.currentTime)) {
            index = i;
        }
    }
    datosLetra.letra[index].txt = newLetra.value;
    var rutaLetra = path.join(__dirname, "music", canciones[playingIndex].songName + ".json");
    fs.writeFile(rutaLetra, JSON.stringify(datosLetra, undefined, 2), () => {
        actualizarLetra();
    })
});
remove.addEventListener("click", () => {
    var index;
    for (let i = 0; i < datosLetra.letra.length; i++) {
        const linea = datosLetra.letra[i];
        if (parseFloat(linea.start) <= parseFloat(player.currentTime)) {
            index = i;
        }
    }
    datosLetra.letra.splice(index, 1);
    var rutaLetra = path.join(__dirname, "music", canciones[playingIndex].songName + ".json");
    fs.writeFile(rutaLetra, JSON.stringify(datosLetra, undefined, 2), () => {
        actualizarLetra();
    })
});
addLetra.addEventListener("click", () => {
    var rutaLetra = path.join(__dirname, "music", canciones[playingIndex].songName + ".json");
    fs.readFile(rutaLetra, (err, data) => {
        var nuevaLinea = '{"start": ' + player.currentTime.toFixed(2) + "," + '"txt": "' + newLetra.value + '"}';
        if (err) {
            var cuerpo = '{"song": "' + canciones[playingIndex].songName + '","lang": "-","author": "-","letra": [' + nuevaLinea + ']}';
            fs.writeFile(rutaLetra, cuerpo, () => {
                newLetra.value = "";
                actualizarLetra();
            })
        } else {
            var cuerpo = JSON.parse(data.toString());
            cuerpo.letra.push(JSON.parse(nuevaLinea));
            cuerpo = JSON.stringify(cuerpo, undefined, 4);
            fs.writeFile(rutaLetra, cuerpo, () => {
                newLetra.value = "";
                actualizarLetra();
            })
        }
    });
});

var rewind = document.getElementById('rewind');
rewind.addEventListener('click', () => {
    player.currentTime = (player.currentTime - 10 < 0) ? player.currentTime = 0 : player.currentTime - 10;
});
// DEBUG - FIN


// ANALYSER
var main = document.getElementsByTagName('main')[0];
var canvas, ctx, source, context, analyser, fbc_array, bars, bar_x, bar_width, bar_height;
window.addEventListener("load", initMp3Player, false);

function initMp3Player() {
    context = new AudioContext();
    analyser = context.createAnalyser();
    canvas = document.getElementById('analyser_render');
    ctx = canvas.getContext('2d');
    source = context.createMediaElementSource(player);
    source.connect(analyser);
    analyser.connect(context.destination);
    frameLooper();
}

function frameLooper() {
    canvas.width = main.offsetWidth;
    canvas.height = main.offsetHeight;
    window.webkitRequestAnimationFrame(frameLooper);
    fbc_array = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(fbc_array);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00CCFF';
    bars = 100;
    for (var i = 0; i < bars; i++) {
        bar_x = i * canvas.width / 100;
        bar_width = canvas.width / 150;
        bar_height = -((fbc_array[i] / 255) * (canvas.height * 0.8));
        ctx.fillRect(bar_x, canvas.height, bar_width, bar_height);
    }
}
// Al cargar
win.webContents.once('dom-ready', () => {
    M.AutoInit(); // Inicializar componentes de Materialize
    fs.readFile(cancionesGuardadasRuta, (err, data) => {
        if (data) {
            canciones = JSON.parse(data).songs;
            console.log(canciones)
            if (canciones[0]) {
                reproducirCancion(canciones[0].songName);
            }
        }
        actualizarLista();
    });

    win.show();
    win.focus();
    win.setThumbarButtons([{
        tooltip: 'Reproducir',
        icon: path.join(__dirname, 'assets', 'play.png'),
        click() {
            player.play();
        }
    }, {
        tooltip: 'Pausar',
        icon: path.join(__dirname, 'assets', 'pause.png'),
        click() {
            player.pause();
        }
    }]);
})