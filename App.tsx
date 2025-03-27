import React from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import MusicPlayer from "./components/MusicPlayer";
import PlayerTest from "./components/PlayerTest";
import Playlist from "./components/PlayList";

const App = () => {
  return (
    <View style={style.container}>
      <StatusBar barStyle="light-content"/>
      <PlayerTest/>
    </View>
  );
}

export default App;

const style = StyleSheet.create({
  container: {
    flex: 1,
  },
})