const React = require("react");

module.exports = {
  View: ({ children, ...props }) => React.createElement("View", props, children),
  Text: ({ children, ...props }) => React.createElement("Text", props, children),
  TouchableOpacity: ({ children, onPress, ...props }) =>
    React.createElement("TouchableOpacity", { ...props, onPress }, children),
  ScrollView: ({ children, ...props }) =>
    React.createElement("ScrollView", props, children),
  Image: (props) => React.createElement("Image", props),
  ActivityIndicator: () => React.createElement("ActivityIndicator"),
  Alert: { alert: jest.fn() },
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
  Platform: { OS: "ios" },
  StyleSheet: { create: (s) => s },
};
