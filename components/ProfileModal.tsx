import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import Colors from '@/constants/Colors';
import { X, User, Lock, CircleHelp as HelpCircle, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSpendingContext } from '@/context/SpendingContext';
import { UserProfile, AppStyle } from '@/types/types';

type ProfileModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function ProfileModal({ visible, onClose }: ProfileModalProps) {
  // Animation values
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const { t } = useTranslation();

  // Get user profile from context
  const { userProfile, updateUserProfile, appStyle, setAppStyle, clearTransactions, setAppLanguage } = useSpendingContext();

  // State for settings
  const [parentName, setParentName] = useState(userProfile?.parentName || '');
  const [childName, setChildName] = useState(userProfile?.childName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [parentalPassword, setParentalPassword] = useState('');
  const [confirmParentalPassword, setConfirmParentalPassword] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<AppStyle>(userProfile?.appStyle || 'girls');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'zh-Hant'>(userProfile?.language || 'en');
  const [currentTab, setCurrentTab] = useState('profile'); // 'profile', 'security', 'settings'
  const [passwordError, setPasswordError] = useState('');
  const [clearPasswordInput, setClearPasswordInput] = useState('');
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [clearPasswordError, setClearPasswordError] = useState('');

  // Update local state when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setParentName(userProfile.parentName);
      setChildName(userProfile.childName);
      setParentalPassword('');
      setConfirmParentalPassword('');
      setCurrentPassword('');
      setSelectedStyle(userProfile.appStyle || 'girls');
      setSelectedLanguage(userProfile.language || 'en');
    }
  }, [userProfile]);

  // Update animation values when visibility changes
  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1);
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withSpring(0.9);
    }
  }, [visible]);

  // Reset error message when changing tabs
  useEffect(() => {
    setPasswordError('');
    setClearPasswordError('');
    setShowClearConfirmation(false);
  }, [currentTab]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const handleSaveProfile = () => {
    if (!parentName.trim() || !childName.trim()) {
      Alert.alert(t('common.error'), t('profile.profileTab.error'));
      return;
    }

    const updatedProfile: UserProfile = {
      parentName,
      childName,
      parentalPassword: userProfile?.parentalPassword || '1234',
      notificationsEnabled: userProfile?.notificationsEnabled || false,
      appStyle: selectedStyle,
      interestRate: userProfile?.interestRate || 5.0,
      termInterestRates: userProfile?.termInterestRates || {
        1: 3.0,
        3: 4.0,
        6: 5.0,
        12: 6.0,
      },
    };

    updateUserProfile(updatedProfile);
    Alert.alert(t('common.success'), t('profile.profileTab.success'));
  };

  const handleSavePassword = () => {
    // Verify the current password first
    if (!currentPassword) {
      setPasswordError(t('profile.securityTab.errors.enterCurrent'));
      return;
    }
    
    if (currentPassword !== userProfile?.parentalPassword) {
      setPasswordError(t('profile.securityTab.errors.incorrectCurrent'));
      return;
    }
    
    if (!parentalPassword.trim() || parentalPassword.length < 4) {
      setPasswordError(t('profile.securityTab.errors.newTooShort'));
      return;
    }
    
    if (parentalPassword !== confirmParentalPassword) {
      setPasswordError(t('profile.securityTab.errors.passwordsNoMatch'));
      return;
    }

    const updatedProfile: UserProfile = {
      ...(userProfile || defaultUserProfile),
      parentalPassword,
    } as UserProfile;

    updateUserProfile(updatedProfile);
    Alert.alert(t('common.success'), t('profile.securityTab.success'));
    setCurrentPassword('');
    setParentalPassword('');
    setConfirmParentalPassword('');
    setPasswordError('');
  };

  const handleSaveSettings = () => {
    if (!userProfile) return;

    const updatedProfile: UserProfile = {
      ...userProfile,
      notificationsEnabled: false, // Always set to false since notifications are removed
      appStyle: selectedStyle,
      language: selectedLanguage,
    };

    updateUserProfile(updatedProfile);
    setAppLanguage(selectedLanguage);
    Alert.alert(t('common.success'), t('profile.settingsTab.success'));
  };

  const handleStyleChange = (style: AppStyle) => {
    setSelectedStyle(style);
  };

  const handleShowClearConfirmation = () => {
    setShowClearConfirmation(true);
    setClearPasswordInput('');
    setClearPasswordError('');
  };

  const handleClearTransactions = () => {
    if (!clearPasswordInput) {
      setClearPasswordError(t('profile.securityTab.errors.enterPassword'));
      return;
    }

    if (clearPasswordInput !== userProfile?.parentalPassword) {
      setClearPasswordError(t('profile.securityTab.errors.incorrectPassword'));
      return;
    }

    // Password is correct, clear transactions
    clearTransactions();
    setShowClearConfirmation(false);
    setClearPasswordInput('');
    Alert.alert(t('common.success'), t('profile.securityTab.clearWarning.success'));
  };

  const handleSendSupportEmail = () => {
    // Construct email mailto URL
    const subject = encodeURIComponent('Kids Piggy Bank App Support');
    const body = encodeURIComponent(`
Hello,

I need help with the Kids Piggy Bank app.

Child's name: ${userProfile?.childName || ''}
Device: ${Platform.OS}

My issue:
[Please describe your issue here]

Thank you!
    `);
    
    const mailtoUrl = `mailto:support@example.com?subject=${subject}&body=${body}`;
    
    // Open email client
    Linking.canOpenURL(mailtoUrl).then(supported => {
      if (supported) {
        return Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          t('common.error'),
          'Email client not available'
        );
      }
    }).catch(error => {
      console.error('An error occurred', error);
      Alert.alert(t('common.error'), 'Could not open email client');
    });
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'profile':
        return (
          <View style={styles.tabContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('profile.profileTab.parentName')}</Text>
              <TextInput
                style={styles.input}
                value={parentName}
                onChangeText={setParentName}
                placeholder={t('profile.profileTab.parentNamePlaceholder')}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('profile.profileTab.childName')}</Text>
              <TextInput
                style={styles.input}
                value={childName}
                onChangeText={setChildName}
                placeholder={t('profile.profileTab.childNamePlaceholder')}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>{t('profile.profileTab.saveChanges')}</Text>
            </TouchableOpacity>
          </View>
        );

      case 'security':
        return (
          <View style={styles.tabContent}>
            {!showClearConfirmation ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('profile.securityTab.currentPassword')}</Text>
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={(text) => {
                      setCurrentPassword(text);
                      setPasswordError('');
                    }}
                    placeholder={t('profile.securityTab.currentPasswordPlaceholder')}
                    secureTextEntry
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('profile.securityTab.newPassword')}</Text>
                  <TextInput
                    style={styles.input}
                    value={parentalPassword}
                    onChangeText={(text) => {
                      setParentalPassword(text);
                      setPasswordError('');
                    }}
                    placeholder={t('profile.securityTab.newPasswordPlaceholder')}
                    secureTextEntry
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('profile.securityTab.confirmPassword')}</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmParentalPassword}
                    onChangeText={(text) => {
                      setConfirmParentalPassword(text);
                      setPasswordError('');
                    }}
                    placeholder={t('profile.securityTab.confirmPasswordPlaceholder')}
                    secureTextEntry
                  />
                  <Text style={styles.helperText}>
                    {t('profile.securityTab.helperText')}
                  </Text>
                </View>
                
                {passwordError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{passwordError}</Text>
                  </View>
                ) : null}

                <TouchableOpacity style={styles.saveButton} onPress={handleSavePassword}>
                  <Text style={styles.saveButtonText}>{t('profile.securityTab.updatePassword')}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.dangerButton} 
                  onPress={handleShowClearConfirmation}
                >
                  <Trash2 size={20} color={Colors.white} />
                  <Text style={styles.dangerButtonText}>{t('profile.securityTab.clearData')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.clearConfirmationContainer}>
                <View style={styles.warningContainer}>
                  <Trash2 size={24} color={Colors.red} />
                  <Text style={styles.clearWarningTitle}>{t('profile.securityTab.clearWarning.title')}</Text>
                  <Text style={styles.clearWarningText}>
                    {t('profile.securityTab.clearWarning.message')}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('profile.securityTab.clearWarning.enterPassword')}</Text>
                  <TextInput
                    style={styles.input}
                    value={clearPasswordInput}
                    onChangeText={(text) => {
                      setClearPasswordInput(text);
                      setClearPasswordError('');
                    }}
                    placeholder={t('parent.auth.placeholder')}
                    secureTextEntry
                  />
                </View>

                {clearPasswordError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{clearPasswordError}</Text>
                  </View>
                ) : null}

                <View style={styles.clearButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.cancelClearButton}
                    onPress={() => setShowClearConfirmation(false)}
                  >
                    <Text style={styles.cancelClearButtonText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.confirmClearButton}
                    onPress={handleClearTransactions}
                  >
                    <Text style={styles.confirmClearButtonText}>{t('profile.securityTab.clearWarning.confirmButton')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );

      case 'settings':
        return (
          <View style={styles.tabContent}>
            <View style={styles.styleContainer}>
              <Text style={styles.styleTitle}>{t('profile.settingsTab.appStyle')}</Text>
              <Text style={styles.styleDescription}>{t('profile.settingsTab.appStyleDescription')}</Text>
              
              <View style={styles.styleOptions}>
                <TouchableOpacity 
                  style={[
                    styles.styleOption,
                    selectedStyle === 'boys' && styles.selectedStyleOption,
                    { backgroundColor: Colors.getStyleColors('boys').lightPrimary }
                  ]}
                  onPress={() => handleStyleChange('boys')}
                >
                  <Text style={[
                    styles.styleOptionText,
                    selectedStyle === 'boys' && styles.selectedStyleOptionText,
                    { color: Colors.getStyleColors('boys').primary }
                  ]}>
                    {t('profile.settingsTab.boysStyle')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.styleOption,
                    selectedStyle === 'girls' && styles.selectedStyleOption,
                    { backgroundColor: Colors.getStyleColors('girls').lightPrimary }
                  ]}
                  onPress={() => handleStyleChange('girls')}
                >
                  <Text style={[
                    styles.styleOptionText,
                    selectedStyle === 'girls' && styles.selectedStyleOptionText,
                    { color: Colors.getStyleColors('girls').primary }
                  ]}>
                    {t('profile.settingsTab.girlsStyle')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.styleContainer}>
              <Text style={styles.styleTitle}>{t('profile.settingsTab.language')}</Text>
              <Text style={styles.styleDescription}>{t('profile.settingsTab.languageDescription')}</Text>
              
              <View style={styles.styleOptions}>
                <TouchableOpacity 
                  style={[
                    styles.styleOption,
                    selectedLanguage === 'en' && styles.selectedStyleOption,
                    { backgroundColor: Colors.lightBlue }
                  ]}
                  onPress={() => setAppLanguage('en')}
                >
                  <Text style={[
                    styles.styleOptionText,
                    selectedLanguage === 'en' && styles.selectedStyleOptionText,
                    { color: Colors.blue }
                  ]}>
                    {t('profile.settingsTab.english')}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.styleOption,
                    selectedLanguage === 'zh-Hant' && styles.selectedStyleOption,
                    { backgroundColor: Colors.lightGreen }
                  ]}
                  onPress={() => setAppLanguage('zh-Hant')}
                >
                  <Text style={[
                    styles.styleOptionText,
                    selectedLanguage === 'zh-Hant' && styles.selectedStyleOptionText,
                    { color: Colors.green }
                  ]}>
                    {t('profile.settingsTab.traditionalChinese')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
              <Text style={styles.saveButtonText}>{t('profile.settingsTab.saveSettings')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.helpButton} onPress={handleSendSupportEmail}>
              <HelpCircle size={20} color={Colors.primary} />
              <Text style={styles.helpButtonText}>{t('profile.settingsTab.helpSupport')}</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.modalContainer, animatedStyle]}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('profile.title')}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <X size={24} color={Colors.darkGray} />
                </TouchableOpacity>
              </View>

              <View style={styles.avatarContainer}>
                <View style={styles.avatarCircle}>
                  <User size={40} color={Colors.primary} />
                </View>
                {userProfile?.childName && (
                  <Text style={styles.userName}>{t('profile.userName', { name: userProfile.childName })}</Text>
                )}
              </View>

              <View style={styles.tabsContainer}>
                <TouchableOpacity
                  style={[styles.tab, currentTab === 'profile' && styles.activeTab]}
                  onPress={() => setCurrentTab('profile')}
                >
                  <User size={20} color={currentTab === 'profile' ? Colors.primary : Colors.darkGray} />
                  <Text
                    style={[
                      styles.tabText,
                      currentTab === 'profile' && styles.activeTabText,
                    ]}
                  >
                    {t('profile.tabs.profile')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tab, currentTab === 'security' && styles.activeTab]}
                  onPress={() => setCurrentTab('security')}
                >
                  <Lock size={20} color={currentTab === 'security' ? Colors.primary : Colors.darkGray} />
                  <Text
                    style={[
                      styles.tabText,
                      currentTab === 'security' && styles.activeTabText,
                    ]}
                  >
                    {t('profile.tabs.security')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tab, currentTab === 'settings' && styles.activeTab]}
                  onPress={() => setCurrentTab('settings')}
                >
                  <HelpCircle size={20} color={currentTab === 'settings' ? Colors.primary : Colors.darkGray} />
                  <Text
                    style={[
                      styles.tabText,
                      currentTab === 'settings' && styles.activeTabText,
                    ]}
                  >
                    {t('profile.tabs.settings')}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.contentContainer}
                showsVerticalScrollIndicator={true}
                scrollIndicatorInsets={{ right: 1 }}
                contentContainerStyle={styles.scrollContentContainer}
              >
                {renderTabContent()}
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 20,
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.lightPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 16,
    color: Colors.text,
    marginTop: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 14,
    color: Colors.darkGray,
    marginLeft: 4,
  },
  activeTabText: {
    color: Colors.primary,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  tabContent: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    padding: 12,
    fontFamily: 'ComicNeue-Regular',
    fontSize: 16,
  },
  helperText: {
    fontFamily: 'ComicNeue-Regular',
    fontSize: 12,
    color: Colors.darkGray,
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: Colors.lightRed,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'ComicNeue-Regular',
    fontSize: 14,
    color: Colors.red,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 16,
    color: Colors.white,
  },
  dangerButton: {
    backgroundColor: Colors.red,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dangerButtonText: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 16,
    color: Colors.white,
    marginLeft: 8,
  },
  clearConfirmationContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
  },
  warningContainer: {
    alignItems: 'center',
    backgroundColor: Colors.lightRed,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  clearWarningTitle: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 18,
    color: Colors.red,
    marginTop: 12,
    marginBottom: 8,
  },
  clearWarningText: {
    fontFamily: 'ComicNeue-Regular',
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  clearButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelClearButton: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelClearButtonText: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 16,
    color: Colors.darkGray,
  },
  confirmClearButton: {
    flex: 1,
    backgroundColor: Colors.red,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginLeft: 8,
  },
  confirmClearButtonText: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 16,
    color: Colors.white,
  },
  styleContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  styleTitle: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 16,
    color: Colors.text,
  },
  styleDescription: {
    fontFamily: 'ComicNeue-Regular',
    fontSize: 12,
    color: Colors.darkGray,
    marginTop: 4,
    marginBottom: 12,
  },
  styleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  styleOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedStyleOption: {
    borderColor: Colors.primary,
  },
  styleOptionText: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 16,
  },
  selectedStyleOptionText: {
    fontWeight: 'bold',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 12,
    backgroundColor: Colors.lightPrimary,
    borderRadius: 12,
  },
  helpButtonText: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 8,
  },
});