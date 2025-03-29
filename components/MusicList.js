import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import TrackPlayer, { usePlaybackState, State } from 'react-native-track-player';
import { getAudioFiles } from './audioService'; // Assurez-vous que le chemin est correct
import { Ionicons } from '@expo/vector-icons';

const MusicList = () => {
    const [songs, setSongs] = useState([]);
    const [currentSong, setCurrentSong] = useState(null);
    const [showIcons, setShowIcons] = useState(null);
    const playbackState = usePlaybackState();

    useEffect(() => {
        const setupPlayer = async () => {
            await TrackPlayer.setupPlayer();
            const audioFiles = await getAudioFiles();
            setSongs(audioFiles);
            await TrackPlayer.add(audioFiles);
        };
        setupPlayer();
    }, []);

    const playSong = async (song) => {
        if (currentSong === song.id && playbackState === State.Playing) {
            await TrackPlayer.pause();
        } else {
            await TrackPlayer.reset();
            await TrackPlayer.add(song);
            await TrackPlayer.play();
            setCurrentSong(song.id);
        }
    };

    const toggleIcons = (songId) => {
        setShowIcons(showIcons === songId ? null : songId);
    };

    const renderItem = ({ item }) => {
        const isPlaying = currentSong === item.id && playbackState === State.Playing;
        return (
            <TouchableOpacity style={[styles.songItem, isPlaying && styles.songItemPlaying]} onPress={() => toggleIcons(item.id)}>
                <Image source={item.artwork} style={styles.musicImage} />
                <View style={styles.songInfo}>
                    <Text style={[styles.songContent, styles.songTitle, isPlaying && styles.songTitlePlaying]}>{item.title}</Text>
                    <Text style={[styles.songContent, styles.songArtist, isPlaying && styles.songArtistPlaying]}>{item.artist}</Text>
                </View>
                {showIcons === item.id && (
                    <TouchableOpacity onPress={() => playSong(item)}>
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
