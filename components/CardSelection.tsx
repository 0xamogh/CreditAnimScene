import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Animated, {Easing} from "react-native-reanimated";
import Card, { Card as CardModel, CARD_WIDTH, CARD_HEIGHT } from "./Card";
import CheckIcon from "./CheckIcon";
import Thumbnail from "./Thumbnail";
import {runTiming, bInterpolate,max} from "react-native-redash";
//import { add } from "lodash";
interface CardSelectionProps {
  cards: [CardModel, CardModel, CardModel];
}
const { Clock,interpolate,block,cond,eq,add,Value,greaterOrEq, useCode,multiply,concat,set,not,and,clockRunning,neq } = Animated;
const INITIAL_INDEX: number = -1;
const timing = (animation: Animated.Value<number>, clock: Animated.Clock) =>
  set(animation, runTiming(clock, 0, { toValue:1, duration: 400, easing : Easing.linear }));

export default ({ cards }: CardSelectionProps) => {
  const selectedCard = new Value(INITIAL_INDEX);
  const cardRotation = cards.map(() => new Value(0));
  const cardZind  = cards.map(() => new Value(0));
  const clock = new Clock();
  const animation = new Value(0);
  const translateX = new Value(CARD_WIDTH);
  const cardTranslations  = cards.map(() => new Value(0));
  const isGroupingANimationDone = new Value(0);
  const selectCard = (index: number)=> selectedCard.setValue(index);
  const shouldUpdateZ =new Value(1);
  useCode(
    block([
      cond(eq(selectedCard, INITIAL_INDEX), [
      timing(animation, clock),
      set(cardRotation[2],bInterpolate(animation,0,-15)),
      set(cardRotation[0],bInterpolate(animation,0,15))
    ]),
    cond(
      and(neq(selectedCard,INITIAL_INDEX),not(isGroupingANimationDone)),
     [
       timing(animation, clock),
      set(translateX, bInterpolate(animation,translateX,0))  ,
      set(
        cardRotation[0],
        bInterpolate(animation,cardRotation[0],-15/2)),
      set(
        cardRotation[1],
        bInterpolate(animation,cardRotation[1],15/2)
        ),
      set(
        cardRotation[2],
        bInterpolate(animation,cardRotation[2],0)
        ),
      cond(not(clockRunning(clock)),set(isGroupingANimationDone,1))
      ]
    ),
    ...cards.map((card,index) => cond(
      and(eq(selectedCard,index),isGroupingANimationDone),
      [
          timing(animation, clock),
          ...cards.map((_card,i) => i)
          .filter((_card,i) => index !== i)
          .map((absoluteIndex,i) =>
          set(
            cardRotation[absoluteIndex],
            bInterpolate(animation,cardRotation[absoluteIndex], 7.5*(i % 2 === 0 ? -1: 1)))),
          set(cardRotation[index],interpolate(animation,{
            inputRange:[0,0.5,1],
            outputRange:[0,45,0]
          })),
          set(cardTranslations[index],interpolate(animation,{
            inputRange : [0,0.5,1],
            outputRange : [0, -CARD_HEIGHT*1.5,1]
          })),
          cond(and(greaterOrEq(animation,0.5),shouldUpdateZ), [
            set(cardZind[index], add(max(...cardZind),1)),
            set(shouldUpdateZ,0)

          ]),
          cond(not(clockRunning(clock)),set(shouldUpdateZ,1))

      ]
    ))

  ]),
    [cards]
  );
  return (
    <View style={styles.container}>
    <View style={styles.cards}>
        {cards.map((card, index) => {
          const translateY = cardTranslations[index];
          const elevation = cardZind[index];
          const zIndex = elevation;
          const rotateZ = concat(cardRotation[index],"deg");
          return (
            <Animated.View
              key={card.id}
              style={{
                ...StyleSheet.absoluteFillObject,
                zIndex,
                elevation,
                transform : [
                  { translateX:multiply(translateX,-1)},
                  {rotateZ},
                  {translateX },
                  {translateY}
                ]
              }}
            >
              <Card key={card.id} {...{ card }} />

            </Animated.View>
          );
        })}
      </View>
      <SafeAreaView>
        {cards.map(({ id, name, color, thumbnail }, index) => (
          <RectButton key={id} onPress={() => selectCard(index)}>
            <View style={styles.button} accessible>
              <Thumbnail {...{ thumbnail }} />
              <View style={styles.label}>
                <Text>{name}</Text>
              </View>
              <CheckIcon {...{ color }} />
            </View>
          </RectButton>
        ))}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  cards: {
    flex: 1,
    backgroundColor: "#f4f6f3"
  },
  button: {
    flexDirection: "row"
  },
  label: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: "#f4f6f3",
    justifyContent: "center"
  }
});
