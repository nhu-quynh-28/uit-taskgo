const { recordAsrScenario } = require("./helpers/asrMetricsStore.cjs");
global.recordAsrScenario = recordAsrScenario;

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: "light" },
}));

jest.mock("react-native/Libraries/Alert/Alert", () => ({
  alert: jest.fn(),
}));

const icon = () => null;
jest.mock("lucide-react-native", () => ({
  Briefcase: icon,
  Calendar: icon,
  MapPin: icon,
  Star: icon,
  Wallet: icon,
}));
