import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface WaveformBarProps {
  isActive: boolean;
  color: string;
  barCount?: number;
  height?: number;
}

export const WaveformBar: React.FC<WaveformBarProps> = ({
  isActive,
  color,
  barCount = 14,
  height = 36,
}) => {
  const anims = useRef<Animated.Value[]>(
    Array.from({ length: barCount }, () => new Animated.Value(0.2))
  ).current;

  useEffect(() => {
    if (!isActive) {
      anims.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 0.2,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
      return;
    }

    const loops = anims.map((anim, idx) => {
      const minVal = 0.15 + (idx % 3) * 0.1;
      const maxVal = 0.5 + ((idx * 7) % 5) * 0.12;
      const duration = 280 + ((idx * 53) % 200);

      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: maxVal,
            duration,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: minVal,
            duration,
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
      return animation;
    });

    return () => {
      loops.forEach((l) => l.stop());
    };
  }, [isActive, anims]);

  return (
    <View style={[styles.container, { height }]}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              opacity: isActive ? 0.9 : 0.35,
              height: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [4, height],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  bar: {
    width: 3.5,
    borderRadius: 3,
    marginHorizontal: 1.5,
  },
});
