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
        return true;
    } catch (err) {
        console.warn('Erreur lors de la demande de permission:', err);
        return false;
    }
};

const getAudioFiles = async () => {
    try {
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) {
            console.log('Permission refusée');
            return [];
        }

        const path = RNFS.ExternalStorageDirectoryPath + '/Music';
        const files = await RNFS.readDir(path);
        const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.m4a'];

        const audioFiles = files.filter(file => {
            return file.isFile() && audioExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        });

        const songs = audioFiles.map(file => ({
            id: file.path,
            title: file.name.replace(/\.[^/.]+$/, ''),
            artwork: require('../assets/default_artwork.png'),
            artist: 'Artiste inconnu',
            url: `file://${file.path}`,
        }));
        return songs;
    } catch (error) {
        console.error('Error reading files:', error);
        return [];
    }
};

const setupPlayer = async () => {
    try {
        await TrackPlayer.setupPlayer();
        const songs = await getAudioFiles();
        
        if (songs.length === 0) {
            console.log("Aucune musique trouvée");
            return false;
        }

        await TrackPlayer.reset();
        await TrackPlayer.add(songs);

        await TrackPlayer.updateOptions({
            stoppingAppPausesPlayback: true,
            capabilities: [
                Capability.Play,
                Capability.Pause,
                Capability.SkipToNext,
                Capability.SkipToPrevious,
                Capability.SeekTo,
                Capability.Stop,
            ],
            compactCapabilities: [
                Capability.Play,
                Capability.Pause,
                Capability.SkipToNext,
                Capability.SkipToPrevious,
            ],
            notification: {
                title: 'Musique en cours',
                artist: 'Artiste inconnu',
                artwork: require('../assets/default_artwork.png'),
            },
        });

        return true;
    } catch (error) {
        console.error("Erreur lors du setup du player:", error);
        return false;
    }
};

const togglePlayback = async (playbackState) => {
    try {
        const currentTrack = await TrackPlayer.getCurrentTrack();
        if (currentTrack == null) {
            console.log("Aucune piste trouvée !");
            return;
        }

        if (playbackState === State.Playing) {
            await TrackPlayer.pause();
            console.log("Mise en pause");
        } else {
            await TrackPlayer.play();
            console.log("Lecture en cours");
        }
    } catch (error) {
        console.error("Erreur dans togglePlayback :", error);
    }
};

const MusicPlayer = () => {

    const playbackState = usePlaybackState();
    const progress = useProgress();

    const [trackArtwork, setTrackArtwork] = useState();
    const [trackArtist, setTrackArtist] = useState();
    const [trackTitle, setTrackTitle] = useState();
    const [songs, setSongs] = useState([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

    const scrollX = useRef(new Animated.Value(0)).current;
    const [songIndex, setSongIndex] = useState(0);
    const [repeatMode, setRepeateMode] = useState('off');
    
    const songSlider = useRef(null);
    const isScrolling = useRef(false);

    const updateTrackInfo = async (index) => {
        if (songs.length === 0 || index < 0 || index >= songs.length) return;
        
        const track = songs[index];
        setTrackTitle(track.title);
        setTrackArtist(track.artist);
        setTrackArtwork(track.artwork);
        setCurrentTrackIndex(index);
        
        await TrackPlayer.skip(index);
        await TrackPlayer.play();
    };

    const handleScrollEnd = async (event) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const newIndex = Math.round(contentOffsetX / width);
        
        if (newIndex !== currentTrackIndex) {
            await updateTrackInfo(newIndex);
        }
        isScrolling.current = false;
    };

    const handleScrollBegin = () => {
        isScrolling.current = true;
    };

    useTrackPlayerEvents([Event.PlaybackTrackChanged, Event.PlaybackState], async (event) => {
        if (event.type === Event.PlaybackTrackChanged && event.nextTrack != null) {
            await updateTrackInfo();
            
            const track = await TrackPlayer.getTrack(event.nextTrack);
            if (track) {
                await TrackPlayer.updateOptions({
                    notification: {
                        title: track.title || 'Titre inconnu',
                        artist: track.artist || 'Artiste inconnu',
                        artwork: track.artwork || require('../assets/default_artwork.png'),
                    },
                });
            }
        }
    });

    const repeatIcon = () => {
        switch (repeatMode) {
            case 'off': return 'repeat-off';
            case 'track': return 'repeat-once';
            case 'repeat': return 'repeat';
            default: return 'repeat-off';
        }
    };

    const changeRepeatMode = () => {
        switch (repeatMode) {
            case 'off':
                TrackPlayer.setRepeatMode(RepeatMode.Track);
                setRepeatMode('track');
                break;
            case 'track':
                TrackPlayer.setRepeatMode(RepeatMode.Queue);
                setRepeatMode('repeat');
                break;
            case 'repeat':
                TrackPlayer.setRepeatMode(RepeatMode.Off);
                setRepeatMode('off');
                break;
        }
    };

    useEffect(() => {
        const initializePlayer = async () => {
            try {
                const success = await setupPlayer();
                if (success) {
                    const loadedSongs = await getAudioFiles();
                    setSongs(loadedSongs);
                    if (loadedSongs.length > 0) {
                        await updateTrackInfo(0);
                    }
                }
            } catch (error) {
                console.error("Erreur lors de l'initialisation:", error);
            }
        };

        initializePlayer();

        const onRemotePlay = TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
        const onRemotePause = TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
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
            TrackPlayer.reset();
        };
    }, []);

    const skipToNext = async () => {
        try {
            await TrackPlayer.skipToNext();
            if (songIndex < songs.length - 1) {
                songSlider.current?.scrollToOffset({
                    offset: (songIndex + 1) * width,
                });
            }
            await TrackPlayer.play();
        } catch (error) {
            console.error("Erreur lors du skipToNext:", error);
        }
    };
    
    const skipToPrevious = async () => {
        try {
            if (progress.position > 3) {
                await TrackPlayer.seekTo(0);
            } else {
                await TrackPlayer.skipToPrevious();
                if (songIndex > 0) {
                    songSlider.current?.scrollToOffset({
                        offset: (songIndex - 1) * width,
                    });
                }
            }
        } catch (error) {
            console.error("Erreur lors du skipToPrevious:", error);
        }
    };

    const renderSongs = ({ item, index }) => {
        return (
            <Animated.View style={style.mainImageWrapper}>
                <View style={[style.imageWrapper, style.elevation]}>
                    <Image 
                        source={item.artwork || require('../assets/default_artwork.png')} 
                        style={style.musicImage} 
                    />
                </View>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={style.container}>
            <View style={style.mainContainer}>
            <Animated.FlatList
                    ref={songSlider}
                    data={songs}
                    renderItem={renderSongs}
                    keyExtractor={item => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScrollBeginDrag={handleScrollBegin}
                    onMomentumScrollEnd={handleScrollEnd}
                    getItemLayout={(data, index) => ({
                        length: width,
                        offset: width * index,
                        index,
                    })}
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
                            {new Date(progress.position * 1000).toISOString().substr(14, 5)}
                        </Text>
                        <Text style={style.progressLabel}>
                            -{new Date((progress.duration - progress.position) * 1000).toISOString().substr(14, 5)}
                        </Text>
                    </View>
                </View>

                <View style={style.musicControlsContainer}>
                    <TouchableOpacity onPress={skipToPrevious}>
                        <Ionicons name='play-skip-back-outline' size={35} color='#FFD369' />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => togglePlayback(playbackState)}>
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

export default MusicPlayer;

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