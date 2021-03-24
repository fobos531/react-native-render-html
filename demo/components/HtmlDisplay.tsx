import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import RenderHTML, {
  RenderersPropsBase,
  RenderHTMLProps
} from 'react-native-render-html';
import LegacyHTML from 'react-native-render-html-v5';
import Constants from 'expo-constants';
import { useComponentColors } from '../state/ThemeProvider';
import DisplayLoading from './DisplayLoading';
import AtomicText from './AtomicText';
import useOnLinkPress from '../hooks/useOnLinkPress';

const DEFAULT_PROPS: Pick<
  RenderHTMLProps,
  'onLinkPress' | 'debug' | 'enableExperimentalPercentWidth'
> = {
  debug: true,
  enableExperimentalPercentWidth: true
};

function stripUnsupportedStylesInLegacy(style: Record<string, any>) {
  return Object.keys(style)
    .filter((k) => k != 'whiteSpace' && k != 'listStyleType')
    .reduce((container, key) => ({ ...container, [key]: style[key] }), {});
}

function stripPropsFromStylesheet(
  styleSheet?: Record<string, Record<string, any>>
) {
  if (!styleSheet) {
    return undefined;
  }
  return Object.entries(styleSheet).reduce(
    (prev, [key, value]) => ({
      ...prev,
      [key]: stripUnsupportedStylesInLegacy(value)
    }),
    {} as Record<string, any>
  );
}

const styles = StyleSheet.create({
  legacyWarningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 30,
    flexGrow: 1
  },
  legacyWarningText: { textAlign: 'center', fontSize: 20, fontStyle: 'italic' }
});

const HtmlDisplay = React.memo(
  ({
    supportsLegacy,
    renderHtmlProps,
    contentWidth,
    style,
    useLegacy = false
  }: {
    contentWidth: number;
    renderHtmlProps: RenderHTMLProps<RenderersPropsBase>;
    supportsLegacy: boolean;
    useLegacy: boolean;
    style?: StyleProp<ViewStyle>;
  }) => {
    const onLinkPress = useOnLinkPress();
    const { color, backgroundColor, border } = useComponentColors('html');
    const baseStyle = {
      color,
      backgroundColor,
      //@ts-ignore
      ...renderHtmlProps.baseStyle
    };
    const sharedProps = {
      ...DEFAULT_PROPS,
      onLinkPress,
      contentWidth,
      ...(renderHtmlProps as any),
      defaultTextProps: {
        selectable: true
      }
    };
    const mergedTagsStyles = {
      ...sharedProps.tagsStyles,
      hr: {
        marginTop: 16,
        marginBottom: 16,
        ...sharedProps.tagsStyles?.hr,
        height: 1,
        backgroundColor: border
      },
      html: {}
    };
    const systemFonts = React.useMemo(
      () => [...Constants.systemFonts, 'space-mono'],
      []
    );
    if (!supportsLegacy && useLegacy) {
      return (
        <View style={styles.legacyWarningContainer}>
          <AtomicText style={styles.legacyWarningText}>
            Legacy HTML component is not available for this snippet.
          </AtomicText>
        </View>
      );
    }

    const renderHtml = useLegacy ? (
      <LegacyHTML
        {...sharedProps}
        html={sharedProps.html}
        baseFontStyle={stripUnsupportedStylesInLegacy(baseStyle)}
        classesStyles={stripPropsFromStylesheet(sharedProps.classesStyles)}
        tagsStyles={stripPropsFromStylesheet(mergedTagsStyles)}
        debug={false}
      />
    ) : (
      <RenderHTML
        {...sharedProps}
        tagsStyles={mergedTagsStyles}
        baseStyle={baseStyle}
        enableUserAgentStyles
        enableExperimentalMarginCollapsing={true}
        debug={false}
        systemFonts={systemFonts}
        remoteLoadingView={() => <DisplayLoading />}
        triggerTREInvalidationPropNames={['baseStyle']}
      />
    );
    return <View style={style}>{renderHtml}</View>;
  }
);

export default HtmlDisplay;
