import Slider from '@react-native-community/slider';
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, Image, Text, FlatList, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import songs from '../model/Data';

const { width, height } = Dimensions.get('window');

const MusicPlayer = () => {
    const [songIndex, setSongIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        scrollX.addListener(({ value }) => {
            const index = Math.round(value / width);
            setSongIndex(index);
        });

        return () => {
            scrollX.removeAllListeners();
        };
    }, []);

    const renderSongs = ({ item, index }) => {
        return (
            <Animated.View style={style.mainImageWrapper}>
                <View style={[style.imageWrapper, style.elevation]}>
                    <Image source={item.artwork} style={style.musicImage} />
                </View>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={style.container}>
            <View style={style.mainContainer}>
                <Animated.FlatList
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
                    {songs[songIndex]?.title}
                </Text>
                <Text style={[style.songArtist, style.songContent]}>
                    {songs[songIndex]?.artist}
                </Text>

                <View>
                    <Slider
                        style={style.progressBar}
                        value={10}
                        minimumValue={0}
                        maximumValue={100}
                        thumbTintColor='#FFD369'
                        maximumTrackTintColor='#FFD369'
                        minimumTrackTintColor='#fff'
                        onSlidingComplete={() => { }}
                    />

                    <View style={style.progressLevelDuration}>
                        <Text style={style.progressLabel}>00:00</Text>
                        <Text style={style.progressLabel}>00:00</Text>
                    </View>
                </View>

                <View style={style.musicControlsContainer}>
                    <TouchableOpacity onPress={() => { }}>
                        <Ionicons name='play-skip-back-outline' size={35} color='#FFD369' />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { }}>
                        <Ionicons name='pause-circle' size={75} color='#FFD369' />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { }}>
                        <Ionicons name='play-skip-forward-outline' size={35} color='#FFD369' />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={style.bottomContainer}>
                <View style={style.bottomIconWrapper}>
                    <TouchableOpacity onPress={() => { }}>
                        <Ionicons name='heart-outline' size={30} color='#888888' />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { }}>
                        <Ionicons name='repeat' size={30} color='#888888' />
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