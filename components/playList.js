import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, PermissionsAndroid, Platform } from 'react-native';
import MusicFiles from 'react-native-get-music-files';

const Playlist = () => {
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  useEffect(() => {
    const requestPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Permission requise',
            message: 'Cette application a besoin d’accéder à votre stockage pour lire les chansons.',
            buttonNeutral: 'Demander plus tard',
            buttonNegative: 'Annuler',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          loadSongs();
        } else {
          console.log('Permission refusée');
        }
      } else {
        loadSongs();
      }
    };

    requestPermission();
  }, []);

  const loadSongs = () => {
    MusicFiles.getAll()
      .then((tracks) => {
        setSongs(tracks);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // Fonctions pour gérer les playlists
  const createPlaylist = (name) => {
    const newPlaylist = {
      id: Math.random().toString(),
      name: name,
      songs: [],
    };
    setPlaylists([...playlists, newPlaylist]);
  };

  const addSongToPlaylist = (playlistId, song) => {
    const updatedPlaylists = playlists.map((playlist) => {
      if (playlist.id === playlistId) {
        return { ...playlist, songs: [...playlist.songs, song] };
      }
      return playlist;
    });
    setPlaylists(updatedPlaylists);
  };

  const removeSongFromPlaylist = (playlistId, songId) => {
    const updatedPlaylists = playlists.map((playlist) => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          songs: playlist.songs.filter((song) => song.id !== songId),
        };
      }
      return playlist;
    });
    setPlaylists(updatedPlaylists);
  };

  const deletePlaylist = (playlistId) => {
    const updatedPlaylists = playlists.filter((playlist) => playlist.id !== playlistId);
    setPlaylists(updatedPlaylists);
  };

  return (
    <View>
      {selectedPlaylist ? (
        <View>
          <Text>{selectedPlaylist.name}</Text>
          <FlatList
            data={selectedPlaylist.songs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View>
                <Text>{item.title}</Text>
                <Text>{item.artist}</Text>
                <Button title="Supprimer" onPress={() => removeSongFromPlaylist(selectedPlaylist.id, item.id)} />
              </View>
            )}
          />
          <Button title="Retour" onPress={() => setSelectedPlaylist(null)} />
        </View>
      ) : (
        <View>
          <FlatList
            data={playlists}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View>
                <Text>{item.name}</Text>
                <Button title="Ouvrir" onPress={() => setSelectedPlaylist(item)} />
                <Button title="Supprimer" onPress={() => deletePlaylist(item.id)} />
              </View>
            )}
          />
          <Button title="Créer une playlist" onPress={() => createPlaylist('Nouvelle Playlist')} />
          <Text>Toutes les chansons :</Text>
          <FlatList
            data={songs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View>
                <Text>{item.title}</Text>
                <Text>{item.artist}</Text>
                <Button title="Ajouter à une playlist" onPress={() => addSongToPlaylist(selectedPlaylist.id, item)} />
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
};

export default Playlist;