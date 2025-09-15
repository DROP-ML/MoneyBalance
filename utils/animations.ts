// Animation utilities for MoneyNote App
import { Animated, Easing } from 'react-native';

export const fadeIn = (animatedValue: Animated.Value, duration: number = 300) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    useNativeDriver: true,
  });
};

export const fadeOut = (animatedValue: Animated.Value, duration: number = 300) => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    useNativeDriver: true,
  });
};

export const scaleIn = (animatedValue: Animated.Value, duration: number = 300) => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    useNativeDriver: true,
  });
};

export class AnimationUtils {
  // Scale animation for buttons
  static scalePress(animatedValue: Animated.Value): Animated.CompositeAnimation {
    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]);
  }

  // Slide in from right
  static slideInRight(animatedValue: Animated.Value, duration: number = 300): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
  }

  // Slide out to right
  static slideOutRight(animatedValue: Animated.Value, screenWidth: number, duration: number = 300): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: screenWidth,
      duration,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
  }

  // Bounce animation for success feedback
  static bounce(animatedValue: Animated.Value): Animated.CompositeAnimation {
    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]);
  }

  // Shake animation for errors
  static shake(animatedValue: Animated.Value): Animated.CompositeAnimation {
    return Animated.sequence([
      Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(animatedValue, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(animatedValue, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(animatedValue, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(animatedValue, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]);
  }

  // Pulse animation for highlighting
  static pulse(animatedValue: Animated.Value): Animated.CompositeAnimation {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
  }

  // Stagger animation for list items
  static staggerAnimation(
    animations: Animated.CompositeAnimation[],
    staggerDelay: number = 100
  ): Animated.CompositeAnimation {
    return Animated.stagger(staggerDelay, animations);
  }

  // Number counting animation
  static animateNumber(
    from: number,
    to: number,
    duration: number,
    callback: (value: number) => void
  ): Animated.CompositeAnimation {
    const animatedValue = new Animated.Value(from);
    
    animatedValue.addListener(({ value }) => {
      callback(value);
    });

    return Animated.timing(animatedValue, {
      toValue: to,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // Can't use native driver for value listeners
    });
  }
}

// Gesture utilities
export class GestureUtils {
  // Check if swipe gesture is valid
  static isSwipeGesture(
    gestureState: any,
    minDistance: number = 50,
    maxVerticalDistance: number = 100
  ): boolean {
    const { dx, dy } = gestureState;
    return Math.abs(dx) > minDistance && Math.abs(dy) < maxVerticalDistance;
  }

  // Get swipe direction
  static getSwipeDirection(gestureState: any): 'left' | 'right' | 'up' | 'down' | null {
    const { dx, dy } = gestureState;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy) {
      return dx > 0 ? 'right' : 'left';
    } else if (absDy > 50) {
      return dy > 0 ? 'down' : 'up';
    }
    
    return null;
  }

  // Check if gesture is a long press
  static isLongPress(duration: number, threshold: number = 500): boolean {
    return duration >= threshold;
  }
}

// Haptic feedback utilities
export class HapticUtils {
  // Light haptic feedback for button presses
  static light(): void {
    // This would use expo-haptics in a real implementation
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  // Medium haptic feedback for selections
  static medium(): void {
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  // Heavy haptic feedback for important actions
  static heavy(): void {
    // Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  // Success haptic feedback
  static success(): void {
    // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // Error haptic feedback
  static error(): void {
    // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  // Warning haptic feedback
  static warning(): void {
    // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}
