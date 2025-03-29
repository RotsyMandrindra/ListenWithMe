import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import TrackPlayer, {
  Capability,
  Event,
  State,
  usePlaybackState,
  useTrackPlayerEvents,
} from 'react-native-track-player';
import { getAudioFiles } from './PlayerTest';
import Ionicons from 'react-native-vector-icons/Ionicons';

const MusicList = () => {
    const [songs, setSongs] = useState([]);
    const [currentSong, setCurrentSong] = useState(null);
    const [showIcons, setShowIcons] = useState(null);
    const playbackState = usePlaybackState();

    // Gestion des événements TrackPlayer
    useTrackPlayerEvents([Event.PlaybackTrackChanged], async event => {
      if (event.type === Event.PlaybackTrackChanged && event.nextTrack != null) {
          const track = await TrackPlayer.getTrack(event.nextTrack);
          const { title, artwork, artist } = track || {};
          setTrackTitle(title || 'Titre inconnu');
          setTrackArtwork(artwork || require('../assets/default_artwork.png'));
          setTrackArtist(artist || 'Artiste inconnu');
  
          await TrackPlayer.updateOptions({
              notification: {
                  title: title || 'Titre inconnu',
                  artist: artist || 'Artiste inconnu',
                  artwork: artwork || require('../assets/default_artwork.png'),
              },
              capabilities: [
                  Capability.Play,
                  Capability.Pause,
                  Capability.SkipToNext,
                  Capability.SkipToPrevious,
                  Capability.Stop,
              ],
              compactCapabilities: [
                  Capability.Play,
                  Capability.Pause,
                  Capability.SkipToNext,
                  Capability.SkipToPrevious,
              ],
          });
      }
  });

    useEffect(() => {
        const setupPlayer = async () => {
            await TrackPlayer.setupPlayer();
            const audioFiles = await getAudioFiles();
            setSongs(audioFiles);
            await TrackPlayer.add(audioFiles);

            // Configurer la notification avec les boutons de contrôle
            await TrackPlayer.updateOptions({
              stoppingAppPausesPlayback: true,
              capabilities: [
                  Capability.Play,
                  Capability.Pause,
                  Capability.SkipToNext,
                  Capability.SkipToPrevious,
                  Capability.Stop,
              ],
              compactCapabilities: [
                  Capability.Play,
                  Capability.Pause,
                  Capability.SkipToNext,
                  Capability.SkipToPrevious,
              ],
              notification: {
                  title: songs[0]?.title || 'Titre inconnu',
                  artist: songs[0]?.artist || 'Artiste inconnu',
                  artwork: songs[0]?.artwork || require('../assets/default_artwork.png'),
              },
          });
        };
        setupPlayer();
    }, []);

    const updateNotification = () => {
        // Mettre à jour la notification avec la chanson en cours
        const currentSongDetails = songs.find(song => song.id === currentSong);
        if (currentSongDetails) {
            TrackPlayer.updateOptions({
                notification: {
                    title: currentSongDetails.title || 'Titre inconnu',
                    artist: currentSongDetails.artist || 'Artiste inconnu',
                    artwork: currentSongDetails.artwork || require('../assets/default_artwork.png'),
                },
            });
        }
    };

    const playSong = async (song) => {
        if (currentSong === song.id && playbackState === State.Playing) {
            await TrackPlayer.pause();
        } else {
            await TrackPlayer.reset();
            await TrackPlayer.add(song);
            await TrackPlayer.play();
            setCurrentSong(song.id);
            updateNotification(); // Mise à jour de la notification quand la chanson change.
        }
    };

    const skipToNext = async () => {
        await TrackPlayer.skipToNext();
    };

    const skipToPrevious = async () => {
        await TrackPlayer.skipToPrevious();
    };

    const toggleIcons = (songId) => {
        setShowIcons(showIcons === songId ? null : songId);
    };

    const renderItem = ({ item }) => {
        const isPlaying = currentSong === item.id && playbackState === State.Playing;
        return (
            <TouchableOpacity style={[styles.songItem, isPlaying && styles.songItemPlaying]} onPress={() => {
              toggleIcons(item.id);
              playSong(item);
            }}>
                <Image source={item.artwork} style={styles.musicImage} />
                <View style={styles.songInfo}>
                    <Text style={[styles.songContent, styles.songTitle, isPlaying && styles.songTitlePlaying]}>{item.title}</Text>
                    <Text style={[styles.songContent, styles.songArtist, isPlaying && styles.songArtistPlaying]}>{item.artist}</Text>
                </View>
                {showIcons === item.id && (
                    <TouchableOpacity>
                        <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color={isPlaying ? '#00ADB5' : '#EEEEEE'} />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={songs}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#222831',
        padding: 10,
    },
    listContainer: {
        paddingBottom: 20,
    },
    songItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomColor: '#393E46',
        borderBottomWidth: 1,
    },
    songItemPlaying: {
        backgroundColor: '#393E46',
    },
    musicImage: {
        width: 50,
        height: 50,
        borderRadius: 10,
        marginRight: 15,
    },
    songInfo: {
        flex: 1,
    },
    songContent: {
        color: '#EEEEEE',
    },
    songTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    songTitlePlaying: {
        color: '#00ADB5',
    },
    songArtist: {
        fontSize: 16,
        fontWeight: '300',
    },
    songArtistPlaying: {
        color: '#00ADB5',
    },
});

export default MusicList;
