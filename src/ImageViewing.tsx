/**
 * Copyright (c) JOB TODAY S.A. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { ComponentType, useCallback, useEffect, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  View,
  VirtualizedList,
  TouchableOpacity,
  ModalProps,
  Image
} from "react-native";

import LinearGradient from 'react-native-linear-gradient';

import Modal from "./components/Modal/Modal";
import ImageItem from "./components/ImageItem/ImageItem";
import ImageDefaultHeader from "./components/ImageDefaultHeader";

import useAnimatedComponents from "./hooks/useAnimatedComponents";
import useImageIndexChange from "./hooks/useImageIndexChange";
import useRequestClose from "./hooks/useRequestClose";
import { ImageSource } from "./@types";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type Props = {
  images: ImageSource[];
  imageIndex: number;
  visible: boolean;
  onRequestClose: () => void;
  onImageIndexChange?: (imageIndex: number) => void;
  presentationStyle?: ModalProps["presentationStyle"];
  animationType?: ModalProps["animationType"];
  backgroundColor?: string;
  swipeToCloseEnabled?: boolean;
  doubleTapToZoomEnabled?: boolean;
  HeaderComponent?: ComponentType<{ imageIndex: number }>;
  FooterComponent?: ComponentType<{ imageIndex: number }>;
  VideoButtonCallback?: (video: {}) => void;
  PrintButtonCallback?: (item: {}) => void;
};

const DEFAULT_ANIMATION_TYPE = "fade";
const DEFAULT_BG_COLOR = "#000";
const SCREEN = Dimensions.get("screen");
const SCREEN_WIDTH = SCREEN.width;

function ImageViewing({
  images,
  imageIndex,
  visible,
  onRequestClose,
  onImageIndexChange,
  animationType = DEFAULT_ANIMATION_TYPE,
  backgroundColor = DEFAULT_BG_COLOR,
  presentationStyle,
  swipeToCloseEnabled,
  doubleTapToZoomEnabled,
  HeaderComponent,
  FooterComponent,
  VideoButtonCallback,
  PrintButtonCallback
}: Props) {
  const imageList = React.createRef<VirtualizedList<ImageSource>>();
  const [opacity, onRequestCloseEnhanced] = useRequestClose(onRequestClose);
  const [currentImageIndex, onScroll] = useImageIndexChange(imageIndex, SCREEN);
  const [
    headerTransform,
    footerTransform,
    toggleBarsVisible
  ] = useAnimatedComponents();
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (onImageIndexChange) {
      setImageLoaded(false);
      onImageIndexChange(currentImageIndex);
    }
  }, [currentImageIndex]);

  const onFinishLoad = useCallback(() => setImageLoaded(true), []);

  const onZoom = useCallback(
    (isScaled: boolean) => {
      // @ts-ignore
      imageList?.current?.setNativeProps({ scrollEnabled: !isScaled });
      toggleBarsVisible(!isScaled);
    },
    [imageList]
  );

  return (
    <Modal
      transparent
      visible={visible}
      presentationStyle={presentationStyle}
      animationType={animationType}
      onRequestClose={onRequestCloseEnhanced}
      supportedOrientations={["portrait"]}
    >
      <View style={[styles.container, { opacity, backgroundColor }]}>
        <Animated.View style={[styles.header, { transform: headerTransform }]}>
          {typeof HeaderComponent !== "undefined" ? (
            React.createElement(HeaderComponent, {
              imageIndex: currentImageIndex
            })
          ) : (
            <ImageDefaultHeader onRequestClose={onRequestCloseEnhanced} />
          )}
        </Animated.View>
        <VirtualizedList
          ref={imageList}
          data={images}
          horizontal
          pagingEnabled
          windowSize={2}
          initialNumToRender={1}
          maxToRenderPerBatch={1}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          initialScrollIndex={imageIndex}
          getItem={(_, index) => images[index]}
          getItemCount={() => images.length}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index
          })}
          renderItem={({ item: imageSrc }) => (
            <View style={{flex: 1, position: 'relative'}}>
              <ImageItem
                onZoom={onZoom}
                onLoad={onFinishLoad}
                imageSrc={imageSrc}
                onRequestClose={onRequestCloseEnhanced}
                swipeToCloseEnabled={swipeToCloseEnabled}
                doubleTapToZoomEnabled={doubleTapToZoomEnabled}
              />
              { imageSrc.type == "VideoMessage" &&
                <View style={styles.imageContainer}>
                  <MaterialIcons.Button
                    borderRadius={20}
                    backgroundColor="#00000050"
                    iconStyle={{marginLeft: 10}}
                    name={'play-arrow'}
                    size={40}
                    color="white"
                    onPress={() => {
                      if (VideoButtonCallback) {
                        VideoButtonCallback(imageSrc)
                      }
                    }}
                  />
                </View>
              }
              { imageSrc.print_button == true &&
                imageLoaded &&
                <TouchableOpacity 
                  onPress={()=>{
                    if(PrintButtonCallback){
                      PrintButtonCallback(imageSrc)
                    }
                  }}
                style={{position: 'absolute', alignItems: 'center', justifyContent: 'center', bottom: 0, left: 0, right: 0, height: 60}}>
                  <LinearGradient style={{width: '100%', height: 60, flex: 1}} colors={['#00000000', '#000000']} >
                    <Image
                        style={{height: '80%', alignSelf: 'center'}}
                        resizeMode={'contain'}
                        source={require('../assets/images/print.png')}
                      />
                  </LinearGradient>
                </TouchableOpacity>

              }
            </View>
          )}
          onMomentumScrollEnd={onScroll}
          keyExtractor={imageSrc => imageSrc.uri}
        />
        {typeof FooterComponent !== "undefined" && (
          <Animated.View
            style={[styles.footer, { transform: footerTransform }]}
          >
            {React.createElement(FooterComponent, {
              imageIndex: currentImageIndex
            })}
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000"
  },
  header: {
    position: "absolute",
    width: "100%",
    zIndex: 1,
    top: 0
  },
  footer: {
    position: "absolute",
    width: "100%",
    zIndex: 1,
    bottom: 0
  },
  imageContainer: {
    position: 'absolute',
    top: 80,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const EnhancedImageViewing = (props: Props) => (
  <ImageViewing key={props.imageIndex} {...props} />
);

export default EnhancedImageViewing;
