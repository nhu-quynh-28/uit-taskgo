import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  StyleSheet, 
  TouchableWithoutFeedback,
  Platform 
} from "react-native";
import { Check, ChevronDown } from "lucide-react-native";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export const Select = ({ options, value, onValueChange, placeholder = "Chọn một mục..." }: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (val: string) => {
    onValueChange(val);
    setIsOpen(false);
  };

  return (
    <View className="w-full">
      {/* Select Trigger - Thay thế styled() bằng className trực tiếp */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setIsOpen(true)}
        className="flex-row h-11 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 shadow-sm active:bg-gray-50"
      >
        <Text 
          className={`text-base ${!selectedOption ? "text-gray-400" : "text-black"}`}
          numberOfLines={1}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        <ChevronDown size={18} color="#6b7280" />
      </TouchableOpacity>

      {/* Select Content (Modal) */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View className="m-5 max-h-[50%] w-[85%] rounded-xl border border-gray-200 bg-white p-2 shadow-2xl">
                <FlatList
                  data={options}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => handleSelect(item.value)}
                      className="relative flex-row w-full items-center justify-between rounded-lg py-4 px-4 active:bg-gray-100"
                    >
                      <Text className={`text-base ${item.value === value ? "font-semibold text-blue-600" : "text-gray-700"}`}>
                        {item.label}
                      </Text>
                      
                      {item.value === value && (
                        <Check size={18} color="#2563eb" strokeWidth={3} />
                      )}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View className="h-[1px] bg-gray-100 mx-2" />}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Backdrop mờ
    justifyContent: "center",
    alignItems: "center",
  },
});