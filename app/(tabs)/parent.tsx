import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSpendingContext } from '@/context/SpendingContext';
import Colors from '@/constants/Colors';
import Header from '@/components/Header';
import { Settings, Lock, TrendingUp, DollarSign, User, Palette } from 'lucide-react-native';
import { formatCurrency } from '@/utils/formatting';
import { TermInterestRates } from '@/types/types';
import { useTranslation } from 'react-i18next';

export default function ParentDashboard() {
  const { t } = useTranslation();
  const { 
    userProfile, 
    updateUserProfile, 
    updateTermInterestRates,
    getInterestRateForTerm,
    addTransaction, 
    getTotalSavings,
    getAvailableBalance,
    appStyle,
    setAppStyle,
    clearTransactions 
  } = useSpendingContext();

  const [showPasswordPrompt, setShowPasswordPrompt] = useState(true);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showTermRates, setShowTermRates] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeNote, setIncomeNote] = useState('');
  const [termRates, setTermRates] = useState<TermInterestRates>({
    0.25: 5.0,
    0.5: 7.0,
    1: 10.0,
    3: 15.0,
  });

  const currentColors = Colors.getStyleColors(appStyle);
  const parentPassword = userProfile?.parentalPassword || '1234';

  const handleAuthentication = () => {
    if (password === parentPassword) {
      setIsAuthenticated(true);
      setShowPasswordPrompt(false);
      setPassword('');
    } else {
      Alert.alert(t('parent.auth.incorrect'), t('common.tryAgain'));
    }
  };

  const handleAddIncome = () => {
    const amount = parseFloat(incomeAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('common.error'), t('addMoney.invalidAmount'));
      return;
    }

    addTransaction({
      id: Date.now().toString(),
      title: incomeNote || 'Allowance',
      amount,
      type: 'income',
      category: 'Pocket Money',
      date: new Date(),
    });

    Alert.alert(
      t('parent.addAllowance.success'), 
      userProfile?.childName 
        ? t('parent.addAllowance.successMessage', { amount: formatCurrency(amount), childName: userProfile.childName })
        : t('parent.addAllowance.successMessageDefault', { amount: formatCurrency(amount) }),
      [{ text: t('common.ok'), style: 'default' }]
    );

    setIncomeAmount('');
    setIncomeNote('');
    setShowAddIncome(false);
  };

  const handleUpdateTermRates = () => {
    // Validate all term rates
    const rates = Object.values(termRates);
    if (rates.some(rate => isNaN(rate) || rate < 0 || rate > 50)) {
      Alert.alert(t('parent.termRates.invalidRates'), t('parent.termRates.invalidRatesMessage'));
      return;
    }

    updateTermInterestRates(termRates);
    Alert.alert(
      t('parent.termRates.success'),
      t('parent.termRates.successMessage'),
      [{ text: t('common.done'), style: 'default' }]
    );

    setShowTermRates(false);
  };

  // Initialize term rates from user profile
  const initializeTermRates = () => {
    if (userProfile?.termInterestRates) {
      setTermRates(userProfile.termInterestRates);
    }
    setShowTermRates(true);
  };

  const handleStyleChange = (style: 'boys' | 'girls') => {
    setAppStyle(style);
    if (userProfile) {
      updateUserProfile({ ...userProfile, appStyle: style });
    }
  };

  const handleResetData = () => {
    Alert.alert(
      t('profile.securityTab.clearData'),
      t('profile.securityTab.clearWarning.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('profile.securityTab.clearWarning.confirmButton'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearTransactions();
              Alert.alert(t('common.success'), t('profile.securityTab.clearWarning.success'));
            } catch (error) {
              Alert.alert(t('common.error'), t('common.tryAgain'));
            }
          }
        }
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Header title={t('parent.title')} />
        
        <View style={styles.authContainer}>
          <View style={[styles.lockContainer, { backgroundColor: currentColors.lightPrimary }]}>
            <Lock size={64} color={currentColors.primary} />
          </View>
          
          <Text style={styles.authTitle}>{t('parent.auth.title')}</Text>
          <Text style={styles.authSubtitle}>
            {t('parent.auth.subtitle')}
          </Text>
          
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            placeholder={t('parent.auth.placeholder')}
            secureTextEntry
            onSubmitEditing={handleAuthentication}
          />
          
          <TouchableOpacity 
            style={[styles.authButton, { backgroundColor: currentColors.primary }]}
            onPress={handleAuthentication}
          >
            <Text style={styles.authButtonText}>{t('parent.auth.button')}</Text>
          </TouchableOpacity>
          
          <Text style={styles.hintText}>
            {t('parent.auth.hint')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title={t('parent.title')} />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Child Overview */}
        <View style={[styles.overviewCard, { backgroundColor: currentColors.lightPrimary }]}>
          <Text style={styles.overviewTitle}>
            {userProfile?.childName 
              ? t('parent.overview.title', { childName: userProfile.childName })
              : t('parent.overview.titleDefault')
            }
          </Text>
          <View style={styles.overviewStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('parent.overview.availableBalance')}</Text>
              <Text style={[styles.statValue, { color: currentColors.primary }]}>
                {formatCurrency(getAvailableBalance())}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('parent.overview.totalSavings')}</Text>
              <Text style={[styles.statValue, { color: Colors.text }]}>
                {formatCurrency(getTotalSavings())}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('parent.quickActions')}</Text>
          
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: Colors.lightGreen }]}
            onPress={() => setShowAddIncome(true)}
          >
            <DollarSign size={32} color={Colors.green} />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>{t('parent.addAllowance.title')}</Text>
              <Text style={styles.actionSubtitle}>{t('parent.addAllowance.subtitle')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: Colors.lightPurple }]}
            onPress={initializeTermRates}
          >
            <Settings size={32} color={Colors.purple} />
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>{t('parent.termRates.title')}</Text>
              <Text style={styles.actionSubtitle}>
                {t('parent.termRates.subtitle')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>


      </ScrollView>

      {/* Add Income Modal */}
      <Modal visible={showAddIncome} animationType="slide" transparent>
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('parent.addAllowance.title')}</Text>
              
              <ScrollView style={{ flex: 1 }}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('common.amount')}</Text>
                  <View style={styles.amountInputContainer}>
                    <Text style={styles.currencySymbol}>HK$</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={incomeAmount}
                      onChangeText={setIncomeAmount}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('addMoney.note')}</Text>
                  <TextInput
                    style={styles.noteInput}
                    value={incomeNote}
                    onChangeText={setIncomeNote}
                    placeholder={t('addMoney.notePlaceholder')}
                    maxLength={50}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddIncome(false);
                    setIncomeAmount('');
                    setIncomeNote('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.confirmButton, { backgroundColor: currentColors.primary }]}
                  onPress={handleAddIncome}
                >
                  <Text style={styles.confirmButtonText}>{t('addMoney.title')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Term-Specific Interest Rates Modal */}
      <Modal visible={showTermRates} animationType="slide" transparent>
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('parent.termRates.modalTitle')}</Text>
              <Text style={styles.modalSubtitle}>
                {t('parent.termRates.modalSubtitle')}
              </Text>
              
              <ScrollView style={styles.termRatesContainer}>
                <View style={styles.termRateItem}>
                  <Text style={styles.termRateLabel}>{t('parent.termRates.terms.1week')}</Text>
                  <View style={styles.rateInputContainer}>
                    <TextInput
                      style={styles.rateInput}
                      value={termRates[0.25].toString()}
                      onChangeText={(text) => setTermRates(prev => ({ ...prev, 0.25: parseFloat(text) || 0 }))}
                      keyboardType="decimal-pad"
                      placeholder="5.0"
                    />
                    <Text style={styles.percentSymbol}>%</Text>
                  </View>
                </View>

                <View style={styles.termRateItem}>
                  <Text style={styles.termRateLabel}>{t('parent.termRates.terms.2weeks')}</Text>
                  <View style={styles.rateInputContainer}>
                    <TextInput
                      style={styles.rateInput}
                      value={termRates[0.5].toString()}
                      onChangeText={(text) => setTermRates(prev => ({ ...prev, 0.5: parseFloat(text) || 0 }))}
                      keyboardType="decimal-pad"
                      placeholder="7.0"
                    />
                    <Text style={styles.percentSymbol}>%</Text>
                  </View>
                </View>

                <View style={styles.termRateItem}>
                  <Text style={styles.termRateLabel}>{t('parent.termRates.terms.1month')}</Text>
                  <View style={styles.rateInputContainer}>
                    <TextInput
                      style={styles.rateInput}
                      value={termRates[1].toString()}
                      onChangeText={(text) => setTermRates(prev => ({ ...prev, 1: parseFloat(text) || 0 }))}
                      keyboardType="decimal-pad"
                      placeholder="10.0"
                    />
                    <Text style={styles.percentSymbol}>%</Text>
                  </View>
                </View>

                <View style={styles.termRateItem}>
                  <Text style={styles.termRateLabel}>{t('parent.termRates.terms.3months')}</Text>
                  <View style={styles.rateInputContainer}>
                    <TextInput
                      style={styles.rateInput}
                      value={termRates[3].toString()}
                      onChangeText={(text) => setTermRates(prev => ({ ...prev, 3: parseFloat(text) || 0 }))}
                      keyboardType="decimal-pad"
                      placeholder="15.0"
                    />
                    <Text style={styles.percentSymbol}>%</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={[styles.infoCard, { backgroundColor: Colors.lightGreen }]}>
                <Text style={styles.infoText}>
                  💡 Tip: Shorter terms can have higher rates to encourage quick savings!
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowTermRates(false);
                    // Reset to current values
                    if (userProfile?.termInterestRates) {
                      setTermRates(userProfile.termInterestRates);
                    }
                  }}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.confirmButton, { backgroundColor: currentColors.primary }]}
                  onPress={handleUpdateTermRates}
                >
                  <Text style={styles.confirmButtonText}>{t('parent.termRates.modalTitle')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  lockContainer: {
    borderRadius: 50,
    padding: 24,
    marginBottom: 24,
  },
  authTitle: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 24,
    color: Colors.text,
    marginBottom: 8,
  },
  authSubtitle: {
    fontFamily: 'ComicNeue-Regular',
    fontSize: 16,
    color: Colors.darkGray,
    textAlign: 'center',
    marginBottom: 32,
  },
  passwordInput: {
    borderWidth: 2,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    fontFamily: 'ComicNeue-Regular',
    fontSize: 16,
    marginBottom: 24,
  },
  authButton: {
    borderRadius: 12,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  authButtonText: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 18,
    color: Colors.white,
  },
  hintText: {
    fontFamily: 'ComicNeue-Regular',
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  overviewCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  overviewTitle: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 20,
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: 'ComicNeue-Regular',
    fontSize: 14,
    color: Colors.darkGray,
    marginBottom: 4,
  },
  statValue: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 20,
    color: Colors.text,
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  actionText: {
    marginLeft: 16,
    flex: 1,
  },
  actionTitle: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontFamily: 'ComicNeue-Regular',
    fontSize: 14,
    color: Colors.darkGray,
  },
  settingCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingTitle: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  styleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  styleOption: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    width: '45%',
  },
  styleEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  styleLabel: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 14,
    color: Colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
    minHeight: 300,
  },
  modalTitle: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 22,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontFamily: 'ComicNeue-Regular',
    fontSize: 14,
    color: Colors.darkGray,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 18,
    color: Colors.text,
  },
  amountInput: {
    flex: 1,
    fontFamily: 'ComicNeue-Bold',
    fontSize: 18,
    color: Colors.text,
    padding: 12,
  },
  noteInput: {
    borderWidth: 2,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    padding: 12,
    fontFamily: 'ComicNeue-Regular',
    fontSize: 16,
  },

  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoText: {
    fontFamily: 'ComicNeue-Regular',
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    padding: 12,
    width: '48%',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 16,
    color: Colors.darkGray,
  },
  confirmButton: {
    borderRadius: 12,
    padding: 12,
    width: '48%',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 16,
    color: Colors.white,
  },
  termRatesContainer: {
    marginBottom: 20,
    maxHeight: 300,
  },
  termRateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  termRateLabel: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  rateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
    minWidth: 100,
    height: 48,
  },
  rateInput: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 18,
    color: Colors.text,
    padding: 8,
    textAlign: 'center',
    flex: 1,
    minHeight: 32,
  },
  percentSymbol: {
    fontFamily: 'ComicNeue-Bold',
    fontSize: 14,
    color: Colors.darkGray,
  },
});