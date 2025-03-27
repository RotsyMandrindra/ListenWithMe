import Slider from '@react-native-community/slider';
import React, { useEffect, useState, useRef } from 'react';
import { 
    View, 
    StyleSheet, 
    SafeAreaView, 
    TouchableOpacity, 
    Dimensions, 
    Image, 
    Text, 
    FlatList, 
    Animated,
    PermissionsAndroid,
    Platform 
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import TrackPlayer, {
    Capability,
    Event,
    RepeatMode,
    State,
    usePlaybackState,
    useProgress,
    useTrackPlayerEvents,
} from 'react-native-track-player';
import RNFS from 'react-native-fs';

const { width, height } = Dimensions.get('window');

// Demande la permission de lecture des fichiers sur Android
const requestStoragePermission = async () => {
    try {
        if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                {
                    title: 'Permission requise',
                    message: 'L\'application a besoin d\'accéder à vos fichiers audio',
                    buttonNeutral: 'Demander plus tard',
                    buttonNegative: 'Annuler',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true; // Sur iOS ou autres plateformes, retourne true directement
    } catch (err) {
        console.warn('Erreur lors de la demande de permission:', err);
        return false;
    }
};

export const getAudioFiles = async () => {
    try {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
            console.log('Permission refusée');
            return [];
        }

        const path = RNFS.ExternalStorageDirectoryPath + '/Music';  // Répertoire Music sur Android
        const files = await RNFS.readDir(path);  // Récupère les fichiers dans le répertoire
        
        // Liste des extensions audio courantes
        const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg'];

        const audioFiles = files.filter(file => {
            // Filtre les fichiers qui ont une extension audio valide
            return file.isFile() && audioExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        });

        const songs = audioFiles.map(file => ({
            id: file.path,  // Utilisation du chemin comme ID unique
            title: file.name.replace(/\.[^/.]+$/, ''),  // Supprime l'extension du nom de fichier
            artwork: require('../assets/default_artwork.png'),  // Image par défaut
            artist: 'Artiste inconnu',  // On peut extraire des métadonnées si nécessaire
            url: `file://${file.path}`,  // Ajout du chemin de l'audio avec le préfixe file://
        }));
        
        return songs;  // Retourne la liste des chansons
    } catch (error) {
        console.error('Error reading files:', error);
        return [];
    }
};

const setupPlayer = async () => {
    await TrackPlayer.setupPlayer();
    const songs = await getAudioFiles();
    
    if (songs.length === 0) {
        console.log("Aucune musique trouvée");
        return;
    }

    await TrackPlayer.add(songs);
    
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

const togglePlayback = async (playbackState, trackTitle, trackArtist, trackArtwork) => {
    try {
        const currentTrack = await TrackPlayer.getCurrentTrack();
        if (currentTrack == null) {
            console.log("Aucune piste trouvée !");
            return;
        }

        const state = await TrackPlayer.getState();
        console.log("Playback State:", state);

        if (state === State.Playing) {
            await TrackPlayer.pause();
            console.log("Mise en pause");
        } else {
            await TrackPlayer.play();
            console.log("Lecture en cours");
        }

        await TrackPlayer.updateOptions({
            nowPlaying: {
                title: trackTitle,
                artist: trackArtist,
                artwork: trackArtwork
            },
            capabilities: [
                Capability.Play,
                Capability.Pause,
                Capability.SkipToNext,
                Capability.SkipToPrevious,
                Capability.Stop,
            ]
        });
    } catch (error) {
        console.error("Erreur dans togglePlayback :", error);
    }
};

const PlayerTest = () => {
    const playbackState = usePlaybackState();
    const progress = useProgress();

    const [trackArtwork, setTrackArtwork] = useState(require('../assets/default_artwork.png'));
    const [trackArtist, setTrackArtist] = useState('Artiste inconnu');
    const [trackTitle, setTrackTitle] = useState('Titre inconnu');
    const [songs, setSongs] = useState([]);

    const scrollX = useRef(new Animated.Value(0)).current;
    const [songIndex, setSongIndex] = useState(0);
    const [repeatMode, setRepeatMode] = useState('off');
    
    const songSlider = useRef(null);

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

    const repeatIcon = () => {
        if (repeatMode == 'off') {
            return 'repeat-off';
        }
        if (repeatMode == 'track') {
            return 'repeat-once';
        }
        if (repeatMode == 'repeat') {
            return 'repeat';
        }
    };

    const changeRepeatMode = () => {
        if (repeatMode == 'off') {
            TrackPlayer.setRepeatMode(RepeatMode.Track);
            setRepeatMode('track');
        } else if (repeatMode == 'track') {
            TrackPlayer.setRepeatMode(RepeatMode.Queue);
            setRepeatMode('repeat');
        } else if (repeatMode == 'repeat') {
            TrackPlayer.setRepeatMode(RepeatMode.Off);
            setRepeatMode('off');
        }
    };

    useEffect(() => {
        const setup = async () => {
            try {
                await setupPlayer();
                const loadedSongs = await getAudioFiles();
                setSongs(loadedSongs);
                
                if (loadedSongs.length > 0) {
                    setTrackTitle(loadedSongs[0].title);
                    setTrackArtist(loadedSongs[0].artist);
                    setTrackArtwork(loadedSongs[0].artwork);
                }

                console.log("Player setup done !");
            } catch (error) {
                console.error("Erreur lors de l'initialisation du player :", error);
            }
        };
    
        setup();

        const onRemotePlay = TrackPlayer.addEventListener(Event.RemotePlay, async () => {
            await TrackPlayer.play();
        });
    
        const onRemotePause = TrackPlayer.addEventListener(Event.RemotePause, async () => {
            await TrackPlayer.pause();
        });
    
        const onRemoteNext = TrackPlayer.addEventListener(Event.RemoteNext, async () => {
            await TrackPlayer.skipToNext();
            await TrackPlayer.play();
        });
    
        const onRemotePrevious = TrackPlayer.addEventListener(Event.RemotePrevious, async () => {
            await TrackPlayer.skipToPrevious();
            await TrackPlayer.play();
        });
    
        scrollX.addListener(({ value }) => {
            const index = Math.round(value / width);
            setSongIndex(index);
        });
    
        return () => {
            scrollX.removeAllListeners();
            onRemotePlay.remove();
            onRemotePause.remove();
            onRemoteNext.remove();
            onRemotePrevious.remove();
        };
    }, []);

    const skipToNext = async () => {
        try {
            if (songIndex < songs.length - 1) {
                await TrackPlayer.skipToNext();
                songSlider.current?.scrollToOffset({
                    offset: (songIndex + 1) * width,
                });
                await TrackPlayer.play();
            }
        } catch (error) {
            console.error("Erreur lors du skipToNext:", error);
        }
    };
    
    const skipToPrevious = async () => {
        try {
            if (songIndex > 0) {
                await TrackPlayer.skipToPrevious();
                songSlider.current?.scrollToOffset({
                    offset: (songIndex - 1) * width,
                });
                await TrackPlayer.play();
            }
        } catch (error) {
            console.error("Erreur lors du skipToPrevious:", error);
        }
    };

    const renderSongs = ({ item, index }) => {
        return (
            <Animated.View style={style.mainImageWrapper}>
                <View style={[style.imageWrapper, style.elevation]}>
                    <Image source={trackArtwork} style={style.musicImage} />
                </View>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={style.container}>
            <View style={style.mainContainer}>
                <Animated.FlatList
                    ref={songSlider}
                    renderItem={renderSongs}
                    data={songs}
                    keyExtractor={item => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    onScroll={Animated.event(
                        [
                            {
                                nativeEvent: {
                                    contentOffset: { x: scrollX },
                                },
                            },
                        ],
                        { useNativeDriver: false }
                    )}
                />

                <Text style={[style.songTitle, style.songContent]}>
                    {trackTitle}
                </Text>
                <Text style={[style.songArtist, style.songContent]}>
                    {trackArtist}
                </Text>

                <View>
                    <Slider
                        style={style.progressBar}
                        value={progress.position}
                        minimumValue={0}
                        maximumValue={progress.duration}
                        thumbTintColor='#FFD369'
                        maximumTrackTintColor='#FFD369'
                        minimumTrackTintColor='#fff'
                        onSlidingComplete={async (value) => {
                            await TrackPlayer.seekTo(value);
                        }}
                    />

                    <View style={style.progressLevelDuration}>
                        <Text style={style.progressLabel}>
                            {Math.floor(progress.position / 60).toString().padStart(2, '0')}:
                            {Math.floor(progress.position % 60).toString().padStart(2, '0')}
                        </Text>
                        <Text style={style.progressLabel}>
                            {Math.floor((progress.duration - progress.position) / 60).toString().padStart(2, '0')}:
                            {Math.floor((progress.duration - progress.position) % 60).toString().padStart(2, '0')}
                        </Text>
                    </View>
                </View>

                <View style={style.musicControlsContainer}>
                    <TouchableOpacity onPress={skipToPrevious}>
                        <Ionicons name='play-skip-back-outline' size={35} color='#FFD369' />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => togglePlayback(playbackState, trackTitle, trackArtist, trackArtwork)}>
                        <Ionicons
                            name={playbackState === State.Playing ? 'pause-circle' : 'play-circle'}
                            size={75}
                            color='#FFD369'
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={skipToNext}>
                        <Ionicons name='play-skip-forward-outline' size={35} color='#FFD369' />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={style.bottomContainer}>
                <View style={style.bottomIconWrapper}>
                    <TouchableOpacity onPress={() => { }}>
                        <Ionicons name='heart-outline' size={30} color='#888888' />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={changeRepeatMode}>
                        <MaterialCommunityIcons 
                            name={repeatIcon()} 
                            size={30} 
                            color={repeatMode !== 'off' ? '#FFD369' : '#888888'} 
                        />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { }}>
                        <Ionicons name='share-outline' size={30} color='#888888' />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { }}>
                        <Ionicons name='ellipsis-horizontal' size={30} color='#888888' />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default PlayerTest;

const style = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#222831',
    },
    mainContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomContainer: {
        width: width,
        alignItems: 'center',
        paddingVertical: 15,
        borderTopColor: '#393E46',
        borderTopWidth: 1,
    },
    bottomIconWrapper: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%'
    },
    imageWrapper: {
        width: 300,
        height: 340,
        marginBottom: 20,
        marginTop: 20,
    },
    musicImage: {
        width: '100%',
        height: '100%',
        borderRadius: 15,
    },
    elevation: {
        elevation: 5,
    },
    songContent: {
        textAlign: 'center',
        color: '#EEEEEE',
    },
    songTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    songArtist: {
        fontSize: 16,
        fontWeight: '300',
    },
    progressBar: {
        width: 350,
        height: 40,
        marginTop: 20,
        flexDirection: 'row',
    },
    progressLevelDuration: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 340,
    },
    progressLabel: {
        color: '#fff',
        fontWeight: '500',
    },
    musicControlsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '60%',
        marginTop: 10,
        marginBottom: 25,
    },
    mainImageWrapper: {
        width: width,
        justifyContent: 'center',
        alignItems: 'center',
    }
});