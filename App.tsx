import React from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import MusicPlayer from "./components/MusicPlayer";
import PlayerTest from "./components/PlayerTest";
import MusicList from "./components/MusicList";

const App = () => {
  return (
    <View style={style.container}>
      <StatusBar barStyle="light-content"/>
      <MusicList/>
    </View>
  );
}

export default App;

const style = StyleSheet.create({
  container: {
    flex: 1,
  },
})