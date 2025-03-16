import Slider from '@react-native-community/slider';
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, Image, Text, FlatList, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import songs from '../model/Data';
import TrackPlayer, {
    Capability,
    Event,
    RepeatMode,
    State,
    usePlaybackState,
    useProgress,
    useTrackPlayerEvents,
} from 'react-native-track-player';

const { width, height } = Dimensions.get('window');

const setupPlayer = async () => {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
        capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
            Capability.Stop,
        ]
    });
    

    await TrackPlayer.add(songs);
}


const togglePlayback = async () => {
    try {
        const currentTrack = await TrackPlayer.getCurrentTrack();
        if (currentTrack == null) {
            console.log("Aucune piste trouvée !");
            return;
        }

        const state = await TrackPlayer.getState(); // Récupérer l'état actuel
        console.log("Playback State:", state);

        if (state === State.Playing) {
            await TrackPlayer.pause();
            console.log("Mise en pause");
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
        } else {
            await TrackPlayer.play();
            console.log("Lecture en cours");
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

    const scrollX = useRef(new Animated.Value(0)).current;
    const [songIndex, setSongIndex] = useState(0);
    const [repeatMode, setRepeateMode] = useState('off');
    
    const songSlider = useRef(null);

    useTrackPlayerEvents([Event.PlaybackTrackChanged], async event => {
        if(event.type == Event.PlaybackTrackChanged && event.nextTrack != null){
            const track = await TrackPlayer.getTrack(event.nextTrack);
            const {title, artwork, artist} = track;
            setTrackTitle(title);
            setTrackArtwork(artwork);
            setTrackArtist(artist);

            await TrackPlayer.updateOptions({
                // Mise à jour de la notification avec le titre de la chanson actuelle
                nowPlaying: {
                    title: track.title,
                    artist: track.artist,
                    artwork: track.artwork
                }
            })
        }
    })

    const repeatIcon = () => {
        if (repeatMode == 'off') {
            return 'repeat-off';
        }if (repeatMode == 'track') {
            return 'repeat-once';
        }if (repeatMode == 'repeat') {
            return 'repeat';
        }
    }

    const changeRepeatMode = () => {
        if (repeatMode == 'off') {
            TrackPlayer.setRepeatMode(RepeatMode.Track);
            setRepeateMode('track');
        }if (repeatMode == 'track') {
            TrackPlayer.setRepeatMode(RepeatMode.Queue);
            setRepeateMode('repeat');
        }if (repeatMode == 'repeat') {
            TrackPlayer.setRepeatMode(RepeatMode.Off);
            setRepeateMode('off');
        }
    }

    useEffect(() => {
        const setup = async () => {
            try {
                await setupPlayer();
                await TrackPlayer.updateOptions({
                    stoppingAppPausesPlayback: true,
                    capabilities: [
                        Capability.Play,
                        Capability.Pause,
                        Capability.SkipToNext,
                        Capability.SkipToPrevious,
                    ],
                    compactCapabilities: [Capability.Play, Capability.Pause],
                });
    
                console.log("Player setup done !");
            } catch (error) {
                console.error("Erreur lors de l'initialisation du player :", error);
            }
        };
    
        setup();
    
        scrollX.addListener(({ value }) => {
            const index = Math.round(value / width);
            setSongIndex(index);
        });
    
        return () => {
            scrollX.removeAllListeners();
        };
    }, []);

    const skipToNext = async () => {
        if (songIndex < songs.length - 1) {
            await TrackPlayer.skipToNext();
            songSlider.current.scrollToOffset({
                offset: (songIndex + 1) * width,
            });
            await TrackPlayer.play();
        }
    };
    
    const skipToPrevious = async () => {
        if (songIndex > 0) {
            await TrackPlayer.skipToPrevious();
            songSlider.current.scrollToOffset({
                offset: (songIndex - 1) * width,
            });
            await TrackPlayer.play();
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
                        onValueChange={(value) => {
                            TrackPlayer.seekTo(value);
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
                    <TouchableOpacity onPress={togglePlayback}>
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
                        <MaterialCommunityIcons name={repeatIcon()} size={30} color={ repeatMode != 'off' ? '#FFD369' : '#888888'} />
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
        elevation: 5
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