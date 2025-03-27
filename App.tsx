import React from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import MusicPlayer from "./components/MusicPlayer";
import PlayerTest from "./components/PlayerTest";

const App = () => {
  return (
    <View style={style.container}>
      <StatusBar barStyle="light-content"/>
      <MusicPlayer/>
    </View>
  );
}

export default App;

const style = StyleSheet.create({
  container: {
    flex: 1,
  },
})