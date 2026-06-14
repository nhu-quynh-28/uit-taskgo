import { authErrorMessage } from "@/lib/auth/messages";
import { useApp } from "@/screens/AppContext";
import { Field, Input, PrimaryButton, Screen } from "@/screens/ui";
import {
  ArrowLeft,
  Briefcase,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  ShoppingBag,
  Sparkles,
  User2
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Text, View, ScrollView, TouchableOpacity } from "react-native";

// --- RoleSelector Component ---
function RoleSelector({ value, onChange }: { value: "customer" | "tasker"; onChange: (r: "customer" | "tasker") => void }) {
  const opts = [
    { id: "customer" as const, label: "Customer", desc: "Book trusted local pros", icon: ShoppingBag },
    { id: "tasker" as const, label: "Tasker", desc: "Earn by completing jobs", icon: Briefcase },
  ];

  return (
    <View className="flex-row gap-3">
      {opts.map((o) => {
        const Icon = o.icon;
        const active = value === o.id;
        return (
          <TouchableOpacity
            key={o.id}
            onPress={() => onChange(o.id)}
            activeOpacity={0.9}
            className={`flex-1 p-4 rounded-2xl border-2 relative ${
              active ? "border-primary bg-secondary" : "border-border bg-card"
            }`}
          >
            <View className={`w-10 h-10 rounded-xl items-center justify-center mb-2 ${
              active ? "bg-primary" : "bg-muted"
            }`}>
              <Icon size={20} color={active ? "#FFFFFF" : "#666666"} />
            </View>
            <Text className="font-bold text-sm">{o.label}</Text>
            <Text className="text-[11px] text-muted-foreground mt-0.5" numberOfLines={2}>
              {o.desc}
            </Text>
            {active && (
              <View className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary items-center justify-center">
                <Check size={12} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// --- SplashScreen Component ---
export function SplashScreen() {
  const { navigate, authLoading, isAuthenticated, authUser, resolvePostAuthScreen } = useApp();

  useEffect(() => {
    if (authLoading) return;

    const t = setTimeout(() => {
      if (isAuthenticated && authUser) {
        navigate(resolvePostAuthScreen(authUser));
      } else {
        navigate("onboarding");
      }
    }, 1400);

    return () => clearTimeout(t);
  }, [authLoading, isAuthenticated, authUser, navigate]);

  return (
    <View className="flex-1 bg-primary items-center justify-center px-8">
      <View className="w-24 h-24 rounded-3xl bg-white/20 items-center justify-center mb-6">
        <Sparkles size={48} color="#FFFFFF" />
      </View>
      <Text className="text-4xl font-black text-white tracking-tight">TaskGo</Text>
      <Text className="mt-3 text-white/80 text-center">Local help, right when you need it.</Text>
      
      <View className="mt-12 flex-row gap-1.5">
        {[0, 1, 2].map((i) => (
          <View 
            key={i} 
            className="w-2 h-2 rounded-full bg-white/60" 
            style={{ opacity: 0.5 + (i * 0.2) }}
          />
        ))}
      </View>
    </View>
  );
}

const slides = [
  { title: "Find trusted local services", desc: "Discover vetted pros for cleaning, repairs, moving and more — all near you.", emoji: "🧹" },
  { title: "Book in just a few taps", desc: "Pick a time, address and pay securely. Your tasker is on the way.", emoji: "📅" },
  { title: "Track and chat in real-time", desc: "See live updates and message your tasker until the job is done.", emoji: "💬" },
];

// --- OnboardingScreen Component ---
export function OnboardingScreen() {
  const { navigate } = useApp();
  const [i, setI] = useState(0);
  
  const currentSlide = slides[i] || slides[0];
  const last = i === slides.length - 1;

  return (
    <Screen className="bg-mint">
      <View className="flex-1 justify-between py-4">
        {/* Top bar */}
        <View className="flex-row justify-end px-4">
          <TouchableOpacity onPress={() => navigate("login")}>
            <Text className="text-sm font-semibold text-muted-foreground">Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Middle content */}
        <View className="items-center justify-center px-8">
          <View className="w-56 h-56 rounded-[48px] bg-white items-center justify-center mb-8 shadow-sm">
            <Text className="text-7xl">{currentSlide.emoji}</Text>
          </View>
          <Text className="text-2xl font-bold text-center text-foreground">{currentSlide.title}</Text>
          <Text className="mt-3 text-muted-foreground text-center">{currentSlide.desc}</Text>
        </View>

        {/* Bottom controls */}
        <View className="px-6 pb-8 gap-y-6">
          <View className="flex-row justify-center gap-x-2">
            {slides.map((_, idx) => (
              <View 
                key={idx} 
                className={`h-2 rounded-full transition-all duration-300 ${idx === i ? "w-8 bg-primary" : "w-2 bg-primary/30"}`} 
              />
            ))}
          </View>
          <PrimaryButton onClick={() => (last ? navigate("login") : setI(i + 1))}>
            <View className="flex-row items-center justify-center gap-x-2">
              <Text className="text-primary-foreground font-bold">{last ? "Get Started" : "Continue"}</Text>
              <ChevronRight size={16} color="white" />
            </View>
          </PrimaryButton>
        </View>
      </View>
    </Screen>
  );
}

// --- LoginScreen Component ---
const DEMO_ACCOUNTS = [
  { label: "Customer", email: "customer@taskgo.app" },
  { label: "Tasker", email: "tasker1@taskgo.app" },
] as const;

export function LoginScreen() {
  const { navigate, role, setRole, login, resolvePostAuthScreen } = useApp();
  const [email, setEmail] = useState("customer@taskgo.app");
  const [pw, setPw] = useState("password123");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = email.includes("@") && pw.length >= 6;

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await login(email.trim(), pw);
      navigate(resolvePostAuthScreen(user));
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen className="bg-background">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48 }}>
        <TouchableOpacity 
          onPress={() => navigate("onboarding")} 
          className="w-10 h-10 rounded-full bg-muted items-center justify-center"
        >
          <ArrowLeft size={20} color="#1A2421" />
        </TouchableOpacity>

        <Text className="text-3xl font-black mt-6 text-foreground">Welcome back 👋</Text>
        <Text className="text-muted-foreground mt-1">Sign in to continue with TaskGo</Text>

        <View className="mt-6">
          <Text className="text-xs font-bold text-muted-foreground mb-3 uppercase">I am a…</Text>
          <RoleSelector value={role} onChange={setRole} />
          <Text className="text-[11px] text-muted-foreground mt-2">
            Your account role is determined at sign-in from the server.
          </Text>
        </View>

        <View className="mt-4 flex-row gap-2">
          {DEMO_ACCOUNTS.map((d) => (
            <TouchableOpacity
              key={d.email}
              onPress={() => {
                setEmail(d.email);
                setPw("password123");
                setRole(d.label === "Tasker" ? "tasker" : "customer");
              }}
              className="px-3 py-2 rounded-xl bg-muted"
            >
              <Text className="text-[11px] font-bold text-muted-foreground">{d.label} demo</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-6 gap-y-4">
          <Field label="Email">
            <View className="relative">
              <View className="absolute left-4 top-4 z-10">
                <Mail size={18} color="#94a3b8" />
              </View>
              <Input 
                value={email} 
                onChangeText={setEmail} 
                className="pl-12" 
                placeholder="you@email.com" 
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </Field>

          <Field label="Password">
            <View className="relative">
              <View className="absolute left-4 top-4 z-10">
                <Lock size={18} color="#94a3b8" />
              </View>
              <Input 
                secureTextEntry={!show} 
                value={pw} 
                onChangeText={setPw} 
                className="pl-12 pr-12" 
                placeholder="••••••••" 
              />
              <TouchableOpacity 
                onPress={() => setShow(!show)} 
                className="absolute right-3 top-3 p-1"
              >
                {show ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
              </TouchableOpacity>
            </View>
          </Field>

          <TouchableOpacity onPress={() => navigate("forgot")} className="items-end">
            <Text className="text-sm font-bold text-primary">Forgot password?</Text>
          </TouchableOpacity>

          {error ? (
            <Text className="text-sm text-red-600 font-semibold text-center">{error}</Text>
          ) : null}

          <PrimaryButton onClick={submit} disabled={!valid || loading} loading={loading}>
            <Text className="text-white font-bold">Sign In</Text>
          </PrimaryButton>

          <View className="flex-row items-center my-4">
            <View className="flex-1 h-[1px] bg-border" />
            <Text className="text-xs text-muted-foreground px-3">OR</Text>
            <View className="flex-1 h-[1px] bg-border" />
          </View>

          <TouchableOpacity 
            className="w-full py-4 rounded-2xl border border-border bg-card flex-row items-center justify-center gap-x-3"
            onPress={submit}
          >
            <Text className="font-bold text-foreground">Continue with Google</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center py-6">
            <Text className="text-sm text-muted-foreground">Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigate("register")}>
              <Text className="text-primary font-bold">Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

// --- RegisterScreen Component ---
export function RegisterScreen() {
  const { navigate, role, setRole, register, resolvePostAuthScreen } = useApp();
  const [f, setF] = useState({ name: "", email: "", phone: "", pw: "", pw2: "", terms: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = f.name && f.email.includes("@") && f.phone.length >= 6 && f.pw.length >= 6 && f.pw === f.pw2 && f.terms;

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await register({
        name: f.name,
        email: f.email,
        phone: f.phone,
        password: f.pw,
        role,
      });
      navigate(resolvePostAuthScreen(user));
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen className="bg-background flex-1">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48 }}>
        <TouchableOpacity onPress={() => navigate("login")} className="w-10 h-10 rounded-full bg-muted items-center justify-center">
          <ArrowLeft size={20} color="#000" />
        </TouchableOpacity>

        <Text className="text-3xl font-black mt-6">Create account</Text>
        <Text className="text-muted-foreground mt-1">Join TaskGo to book or earn nearby</Text>

        <View className="mt-6">
          <Text className="text-xs font-bold text-muted-foreground mb-3 uppercase">Sign up as…</Text>
          <RoleSelector value={role} onChange={setRole} />
        </View>

        <View className="mt-6 space-y-4">
          <Field label="Full name">
            <View className="relative">
              <View className="absolute left-4 top-4 z-10"><User2 size={18} color="#999" /></View>
              <Input value={f.name} onChangeText={(v) => setF({ ...f, name: v })} placeholder="Alex Morgan" className="pl-12" />
            </View>
          </Field>

          <Field label="Email">
            <View className="relative">
              <View className="absolute left-4 top-4 z-10"><Mail size={18} color="#999" /></View>
              <Input value={f.email} onChangeText={(v) => setF({ ...f, email: v })} placeholder="you@email.com" className="pl-12" keyboardType="email-address" />
            </View>
          </Field>

          <Field label="Phone number">
            <View className="relative">
              <View className="absolute left-4 top-4 z-10"><Phone size={18} color="#999" /></View>
              <Input value={f.phone} onChangeText={(v) => setF({ ...f, phone: v })} placeholder="+1 555 0142" className="pl-12" keyboardType="phone-pad" />
            </View>
          </Field>

          <Field label="Password">
            <Input secureTextEntry value={f.pw} onChangeText={(v) => setF({ ...f, pw: v })} placeholder="At least 6 characters" />
          </Field>

          <Field label="Confirm password" error={f.pw2 && f.pw !== f.pw2 ? "Passwords don't match" : undefined}>
            <Input secureTextEntry value={f.pw2} onChangeText={(v) => setF({ ...f, pw2: v })} placeholder="Repeat password" />
          </Field>

          <TouchableOpacity 
            className="flex-row items-center space-x-3 mt-2"
            onPress={() => setF({ ...f, terms: !f.terms })}
          >
            <View className={`w-5 h-5 rounded border-2 items-center justify-center ${f.terms ? "bg-primary border-primary" : "border-border"}`}>
              {f.terms && <Check size={12} color="white" />}
            </View>
            <Text className="text-sm text-muted-foreground flex-1">
              I agree to the <Text className="text-primary font-bold">Terms</Text> and <Text className="text-primary font-bold">Privacy</Text>
            </Text>
          </TouchableOpacity>

          {error ? (
            <Text className="text-sm text-red-600 font-semibold text-center">{error}</Text>
          ) : null}

          <PrimaryButton onClick={submit} disabled={!valid || loading} loading={loading}>
            <Text className="text-white font-bold">Create Account</Text>
          </PrimaryButton>
        </View>
      </ScrollView>
    </Screen>
  );
}

// --- ForgotScreen Component ---
export function ForgotScreen() {
  const { navigate } = useApp();
  const [email, setEmail] = useState("");

  return (
    <Screen className="bg-background flex-1 px-6 pt-12">
      <TouchableOpacity onPress={() => navigate("login")} className="w-10 h-10 rounded-full bg-muted items-center justify-center mb-6">
        <ArrowLeft size={20} color="#000" />
      </TouchableOpacity>

      <View>
        <Text className="text-3xl font-black">Forgot password?</Text>
        <Text className="text-muted-foreground mt-1">
          Password reset is not available in the app yet. Contact support or use your demo account credentials.
        </Text>
        <View className="mt-8 space-y-4">
          <Field label="Email">
            <Input value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" />
          </Field>
          <PrimaryButton onClick={() => navigate("login")} disabled={!email.includes("@")}>
            <Text className="text-white font-bold">Back to Sign In</Text>
          </PrimaryButton>
        </View>
      </View>
    </Screen>
  );
}