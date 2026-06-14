import { ConnectionBanner } from "@/components/ux/ConnectionBanner";
import { IncomingJobAlertOverlay } from "@/components/ux/IncomingJobAlertBanner";
import { useApp } from "@/screens/AppContext";
import { BottomNav } from "@/screens/BottomNav";
import React from "react";
import { LogBox, StatusBar, StyleSheet, View } from "react-native";

// Import Screens (Giả định bạn đã chia folder như cấu trúc file Web)
import { ForgotScreen, LoginScreen, OnboardingScreen, RegisterScreen, SplashScreen } from "@/screens/Auth";
import {
  BookingConfirmScreen,
  BookingFormScreen,
  OrderMatchingScreen,
  PaymentScreen, PaymentSuccessScreen, ReceiptScreen,
  TaskerListScreen, TaskerProfileScreen,
} from "@/screens/Booking";
import { ChatListScreen, ChatScreen } from "@/screens/Chat";
import { CategoryScreen, HomeScreen, SearchScreen, ServiceDetailScreen } from "@/screens/Home";
import { CompletedScreen, OrderDetailScreen, OrdersScreen, TrackingScreen } from "@/screens/Order";
import {
  AddressesScreen,
  EditProfileScreen,
  HelpScreen,
  PaymentMethodsScreen,
  ProfileScreen,
  SettingsScreen,
} from "@/screens/Profile";
import { ReviewsScreen, SubmitReviewScreen } from "@/screens/Reviews";
import {
  ActiveJobsScreen,
  CustomerInfoScreen,
  EarningDetailScreen,
  EarningsScreen,
  EditServicesScreen,
  IncomingOrdersScreen,
  JobDetailScreen, JobStatusScreen, NavigationScreen,
  NearbyJobsScreen, OrderRequestDetailScreen,
  ServiceProgressScreen,
  TaskerDashboardScreen,
  TaskerDocumentsScreen, TaskerPendingScreen, TaskerRejectedScreen,
  TaskerProfilePageScreen,
  TaskerRegisterScreen,
  TaskerReviewsScreen,
  WithdrawScreen,
} from "@/screens/Tasker";

LogBox.ignoreLogs(['Setting a timer']);

export default function Router() {
  const { screen, darkMode, role } = useApp();

  const mainScreens = role === "tasker"
    ? ["tDashboard", "tJobs", "tEarnings", "tProfile"]
    : ["home", "orders", "chatList", "reviews", "profile"];

  const showBottomNav = mainScreens.includes(screen);

  const map: Record<string, React.ComponentType<any>> = {
    splash: SplashScreen, onboarding: OnboardingScreen, login: LoginScreen,
    register: RegisterScreen, forgot: ForgotScreen,
    home: HomeScreen, category: CategoryScreen, search: SearchScreen, serviceDetail: ServiceDetailScreen,
    taskerList: TaskerListScreen, taskerProfile: TaskerProfileScreen,
    bookingForm: BookingFormScreen, bookingConfirm: BookingConfirmScreen,
    orderMatching: OrderMatchingScreen,
    payment: PaymentScreen, paymentSuccess: PaymentSuccessScreen, receipt: ReceiptScreen,
    orders: OrdersScreen, orderDetail: OrderDetailScreen, tracking: TrackingScreen, completed: CompletedScreen,
    chatList: ChatListScreen, chat: ChatScreen,
    reviews: ReviewsScreen, submitReview: SubmitReviewScreen,
    profile: ProfileScreen, editProfile: EditProfileScreen, addresses: AddressesScreen,
    paymentMethods: PaymentMethodsScreen, settings: SettingsScreen, help: HelpScreen,
    tRegister: TaskerRegisterScreen, tDocuments: TaskerDocumentsScreen,
    tPending: TaskerPendingScreen, tRejected: TaskerRejectedScreen,
    tDashboard: TaskerDashboardScreen, tJobs: ActiveJobsScreen,
    tEarnings: EarningsScreen, tProfile: TaskerProfilePageScreen,
    tIncoming: IncomingOrdersScreen, tNearby: NearbyJobsScreen, tOrderRequest: OrderRequestDetailScreen,
    tJobDetail: JobDetailScreen, tJobStatus: JobStatusScreen,
    tNavigation: NavigationScreen, tCustomerInfo: CustomerInfoScreen, tProgress: ServiceProgressScreen,
    tEarningDetail: EarningDetailScreen, tWithdraw: WithdrawScreen,
    tReviews: TaskerReviewsScreen, tEditServices: EditServicesScreen,
  };

  const ScreenComponent = map[screen] || HomeScreen;

  return (
    <View style={[styles.container, { backgroundColor: darkMode ? "#121212" : "#FFFFFF" }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <ConnectionBanner />

      <View
        style={[styles.screenWrapper, { paddingBottom: showBottomNav ? 90 : 0 }]}
        pointerEvents="box-none"
      >
        <IncomingJobAlertOverlay />
        <View style={styles.screenContent} pointerEvents="auto">
          <ScreenComponent />
        </View>
      </View>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
  screenContent: {
    flex: 1,
  },
});
