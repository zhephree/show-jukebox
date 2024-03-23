let songs = [];
let shows = [];
let selectedShow = null;
let lastSongPlayed = false;

const E = (id) => document.getElementById(id);
const emptyList = (select) => {
    select.options.length = 0;
}
const addItem = (select, itemValue, itemText) => {
    const option = document.createElement('option');
    option.value = itemValue;
    option.text = itemText? itemText: itemValue;
    select.add(option, null);
}

const API = {
    get: async (url) => {
        try {
            const r = await fetch(`/api/${url}`);
            const json = r.json();

            return json;
        }catch(err){
            console.error(err);
            return err;
        }
    },
    post: async (url, data) => {
        try {
            const r = await fetch(`/api/${url}`, {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            const json = await r.json();

            return json;
        }catch(err){
            console.error(err);
            return err;
        }
    },
    put: async (url, data) => {
        try {
            const r = await fetch(`/api/${url}`, {
                method: 'PUT',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            const json = await r.json();

            return json;
        }catch(err){
            console.error(err);
            return err;
        }
    }
}

const loadShows = async () => {

    const json = await API.get('shows');
    if(json.success === false){
        return;
    }

    shows = json.shows;

    const select = E('shows')
    emptyList(select)
    addItem(select, '', 'Select a Show');

    json.shows.forEach((show, i) => {
        addItem(select, i, show.showName);
    })
}

const loadSongs = async () => {
    songs = await API.get('songs');

    const songLists = document.querySelectorAll('.song-list');
    songLists.forEach((select) => {
        emptyList(select);
        addItem(select, '');

        songs.forEach((song) => {
            addItem(select, song);
        })
    })
}

const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    loadShows();
    loadSongs();

    document.addEventListener('keypress', (e) => {
        console.log('keypress', e);
        if(e.key === 'Enter'){
            if(!E('pause-intro').classList.contains('hidden')){ //intor is playing
                E('pause-intro').click();
            }else if(lastSongPlayed === true){
                E('play-outro').click();
            }else if(E('stop-walk-song').classList.contains('hidden')){ //is paused
                E('play-walk-song').click();
            }else{ //wlak is playing
                E('stop-walk-song').click();
            }
        }
    })

    document.addEventListener('mouseup', (e) => {
        console.log('mouseup', e);
    })


    E('add-show').addEventListener('click', async (e) => {
        e.preventDefault();

        const showName = prompt('Enter the name of the show:');
        if(showName){
            const json = await API.post('shows', {name: showName});
        }
    })

    E('edit-show').addEventListener('click', (e) => {
        e.preventDefault();

        const show = shows[parseInt(E('shows').value)];
        const walk_list = E('walk-songs');

        E('show-name').value = show.showName;
        E('intro-song').value = show.intro;
        E('outro-song').value = show.outro;
        
        emptyList(walk_list);
        show.songs.forEach((song) => {
            addItem(walk_list, song)
        })

        E('show-setup').classList.toggle('hidden');
    })
    

    E('add-to-list').addEventListener('click', (e) => {
        e.preventDefault();

        const select = E('song-pool');
        const list = E('walk-songs');
        Array.from(select.options).filter((option) => {
            return option.selected;
        }).forEach((option) => {
            addItem(list, option.value, option.text)
        })  
    })

    E('remove').addEventListener('click', (e) => {
        e.preventDefault();

        const select = E('walk-songs');
        select.remove(select.options.selectedIndex);
    })

    E('empty').addEventListener('click', (e) => {
        e.preventDefault();

        emptyList(E('walk-songs'));
    })

    E('move-up').addEventListener('click', (e) => {
        e.preventDefault();

        const select = E('walk-songs');
        const idx = parseInt(select.options.selectedIndex);
        if(idx > 0){
            const selectedItem = select.options[idx];
            select.remove(idx);
            select.add(selectedItem, idx - 1)
        }
    })

    E('move-down').addEventListener('click', (e) => {
        e.preventDefault();

        const select = E('walk-songs');
        const idx = parseInt(select.options.selectedIndex);
        if(idx < select.options.length){
            const selectedItem = select.options[idx];
            select.remove(idx);
            select.add(selectedItem, idx + 1)
        }
    })

    E('save-show').addEventListener('click', async (e) => {
        e.preventDefault();

        const show = shows[parseInt(E('shows').value)];

        show.showName = E('show-name').value;
        show.intro = E('intro-song').value;
        show.outro = E('outro-song').value;
        show.songs = Array.from(E('walk-songs').options).map((song) => song.value);

        await API.put('shows', show)
    })

    E('select-show').addEventListener('click', (e) => {
        e.preventDefault();

        selectedShow = shows[parseInt(E('shows').value)];
        E('playlist').classList.toggle('hidden');
        audioRegistry.register(selectedShow.intro);
        audioRegistry.register(selectedShow.outro);
        
        emptyList(E('playlist-walk-songs'));
        for(const song of selectedShow.songs){
            audioRegistry.register(song, () => {
                E('stop-walk-song').classList.add('hidden');
                E('play-walk-song').classList.remove('hidden');
        
                const playlist = E('playlist-walk-songs');

                if(playlist.options.selectedIndex < playlist.options.length - 1){
                    playlist.options.selectedIndex = playlist.options.selectedIndex + 1;
                }else{
                    lastSongPlayed = true;
                }     
            });
            addItem(E('playlist-walk-songs'), song, song);
        }
    })

    E('play-intro').addEventListener('click', (e) => {
        e.preventDefault();

        audioRegistry.play(selectedShow.intro);
        E('pause-intro').classList.toggle('hidden');
        E('play-intro').classList.toggle('hidden');
    })

    E('pause-intro').addEventListener('click', (e) => {
        e.preventDefault();

        audioRegistry.fadeOut(selectedShow.intro);
        E('pause-intro').classList.toggle('hidden');
        E('play-intro').classList.toggle('hidden');
    })

    E('play-outro').addEventListener('click', (e) => {
        e.preventDefault();

        audioRegistry.play(selectedShow.outro);
        E('pause-outro').classList.toggle('hidden');
        E('play-outro').classList.toggle('hidden');
    })

    E('pause-outro').addEventListener('click', (e) => {
        e.preventDefault();

        audioRegistry.fadeOut(selectedShow.outro);
        E('pause-outro').classList.toggle('hidden');
        E('play-outro').classList.toggle('hidden');
    })

    E('play-walk-song').addEventListener('click', (e) => {
        e.preventDefault();

        let selectedSong = (E('playlist-walk-songs').value);
        if(selectedSong === ''){
            E('playlist-walk-songs').options.selectedIndex = 0;
            selectedSong = (E('playlist-walk-songs').value);
        }

        audioRegistry.play(selectedSong);
        E('stop-walk-song').classList.toggle('hidden');
        E('play-walk-song').classList.toggle('hidden');
    })

    E('stop-walk-song').addEventListener('click', (e) => {
        e.preventDefault();

        const playlist = E('playlist-walk-songs');

        const selectedSong = (playlist.value);

        audioRegistry.fadeOut(selectedSong);
        E('stop-walk-song').classList.toggle('hidden');
        E('play-walk-song').classList.toggle('hidden');

        if(playlist.options.selectedIndex < playlist.options.length - 1){
            playlist.options.selectedIndex = playlist.options.selectedIndex + 1;
        }else{
            lastSongPlayed = true;
        }
    })

    E('shuffle-walk-songs').addEventListener('click', (e) => {
        e.preventDefault();

        const playlist = E('playlist-walk-songs');
        let songs = [...selectedShow.songs];
        shuffleArray(songs);
        
        emptyList(E('playlist-walk-songs'));
        for(const song of songs){
            addItem(E('playlist-walk-songs'), song, song);
        }
    })

    E('shows').addEventListener('change', (e) => {

    })
})

class AudioRegistry {
    constructor(){
        this.PAUSED = 0;
        this.PLAYING = 1;
        this.ENDED = 2;

        this.players = {};
        this.activePlayer = null;
        this.activePlayerState = this.PAUSED;
    }

    register(file, onEndCallback){
        const audio = new Audio(`/songs/${file}`);
        audio.preload = true;
        audio.addEventListener('ended', (e) => {
            this.onEnd();
            if(typeof onEndCallback === 'function'){
                onEndCallback();
            }
        })
        audio.addEventListener('play', (e) => {
            this.activePlayer = audio;
            this.activePlayerState = this.PLAYING;
        })
        this.players[file] = audio;
    }

    play(file){
        this.activePlayer?.pause();
        this.players[file].volume = 1;
        this.players[file].play();
    }

    pause(file){
        this.players[file].pause();
        this.activePlayerState = this.PAUSED;
    }

    onEnd(){
        this.activePlayer = null;
        this.activePlayerState = this.ENDED;
    }

    fadeOut(file = null){
        const player = file? this.players[file]: this.activePlayer;

        this.lastVolume = player.volume;
        let vol = this.lastVolume;

        let intervalId = setInterval(() => {
            if(vol > 0){
                vol -= 0.05;
                player.volume = vol.toFixed(2);
            }else{
                clearInterval(intervalId);
                player.pause();
            }
        }, 100)
    }
}

const audioRegistry = new AudioRegistry();