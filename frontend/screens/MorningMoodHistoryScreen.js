/**
 * SKIN IQ — MorningMoodHistoryScreen
 * Dark theme · Violet accent · Full history cards
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, StatusBar,
  ActivityIndicator, Alert,
} from 'react-native';
import api from '../api';

const T = {
  bg0:'#0D0D14', bg1:'#13131F', bg2:'#1A1A2E', bg3:'#22223A', bg4:'#2A2A45',
  border:'#2E2E50',
  text:'#F0EFF8', text2:'#B8B5D4', text3:'#7A7898', text4:'#4A4870',
  accent:'#39E07A', accentDim:'rgba(57,224,122,0.12)',
  amber:'#FBBF24', amberDim:'rgba(251,191,36,0.12)',
  violet:'#A78BFA', violetDim:'rgba(167,139,250,0.14)', violetGlow:'rgba(167,139,250,0.28)',
  rose:'#FB7185', roseDim:'rgba(251,113,133,0.12)',
  teal:'#2DD4BF', tealDim:'rgba(45,212,191,0.12)',
  success:'#39E07A', warning:'#FBBF24', error:'#FF6B6B',
};

const MOOD_MAP = {
  energetic: { emoji:'⚡', color:T.accent  },
  normal:    { emoji:'😊', color:T.teal    },
  tired:     { emoji:'😴', color:T.amber   },
  very_tired:{ emoji:'😫', color:T.error   },
};
const SEV_CLR = { none:T.success, mild:T.amber, moderate:T.rose, severe:T.error };

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', {
  day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit',
});

export default function MorningMoodHistoryScreen({ navigation }) {
  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/morning-mood-history');
      setHistory(res.data);
    } catch {
      Alert.alert('Error', 'Failed to load history.');
    } finally { setLoading(false); }
  };

  const doRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <TopBar nav={navigation} onRefresh={doRefresh} refreshing={refreshing} />
        <View style={s.center}><ActivityIndicator size="large" color={T.violet} /><Text style={s.loadTxt}>Loading history…</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg1} />
      <TopBar nav={navigation} onRefresh={doRefresh} refreshing={refreshing} />

      {history.length > 0 && (
        <View style={s.countRow}>
          <View style={[s.countPill, { backgroundColor:T.violetDim, borderColor:T.violet+'44' }]}>
            <Text style={[s.countTxt, { color:T.violet }]}>{history.length} Records</Text>
          </View>
        </View>
      )}

      {history.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize:56, marginBottom:16 }}>🌅</Text>
          <Text style={s.emptyTitle}>No Morning Records Yet</Text>
          <Text style={s.emptySub}>Start your morning ritual to build your mood history</Text>
          <TouchableOpacity style={[s.emptyBtn, { backgroundColor:T.amber }]} onPress={() => navigation.navigate('MorningMoodAnalyzer')}>
            <Text style={s.emptyBtnTxt}>Start Now →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
          {history.map((item, idx) => {
            const mood = MOOD_MAP[item.morning_mood] || MOOD_MAP.normal;
            const dcC  = SEV_CLR[item.dark_circle_severity] || T.text3;
            const pfC  = SEV_CLR[item.skin_puffiness] || T.text3;
            const slC  = { good:T.success, average:T.amber, poor:T.error }[item.sleep_quality_estimate] || T.text3;

            return (
              <View key={item.id || idx} style={s.card}>
                {/* CARD HEADER */}
                <View style={s.cardTop}>
                  <View style={[s.moodCircle, { backgroundColor:mood.color+'20', borderColor:mood.color+'60' }]}>
                    <Text style={{ fontSize:20 }}>{mood.emoji}</Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={s.dateTxt}>{fmt(item.created_at)}</Text>
                    <Text style={[s.moodLbl, { color:mood.color }]}>{(item.morning_mood||'').replace('_',' ')}</Text>
                  </View>
                  {item.model_confidence > 0 && (
                    <View style={s.confBadge}>
                      <Text style={s.confBadgeTxt}>{Math.round(item.model_confidence * 100)}%</Text>
                    </View>
                  )}
                </View>

                <View style={s.div} />

                {/* METRICS */}
                <View style={s.metrics}>
                  <View style={s.metric}>
                    <Text style={s.metricLbl}>Dark Circles</Text>
                    <Text style={[s.metricVal, { color:dcC }]}>{(item.dark_circle_severity||'—').toUpperCase()}</Text>
                  </View>
                  <View style={s.metricDiv} />
                  <View style={s.metric}>
                    <Text style={s.metricLbl}>Puffiness</Text>
                    <Text style={[s.metricVal, { color:pfC }]}>{(item.skin_puffiness||'—').toUpperCase()}</Text>
                  </View>
                  <View style={s.metricDiv} />
                  <View style={s.metric}>
                    <Text style={s.metricLbl}>Sleep</Text>
                    <Text style={[s.metricVal, { color:slC }]}>{(item.sleep_quality_estimate||'—').toUpperCase()}</Text>
                  </View>
                </View>

                {/* AI SKIN */}
                {item.model_prediction && (
                  <View style={s.aiRow}>
                    <Text style={s.aiLbl}>🤖 AI Skin Type</Text>
                    <Text style={[s.aiVal, { color:T.amber }]}>{item.model_prediction.toUpperCase()}</Text>
                  </View>
                )}

                {/* VIEW FULL */}
                <TouchableOpacity
                  style={s.viewBtn}
                  onPress={() => Alert.alert('Full Analysis', item.recommendation ? item.recommendation.substring(0, 400) + '…' : 'No details available.')}
                >
                  <Text style={[s.viewBtnTxt, { color:T.violet }]}>View Full Analysis →</Text>
                </TouchableOpacity>
              </View>
            );
          })}
          <View style={{ height:30 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function TopBar({ nav, onRefresh, refreshing }) {
  return (
    <View style={s.topBar}>
      <TouchableOpacity onPress={() => nav.goBack()} style={s.backBtn}><Text style={s.backTxt}>← Back</Text></TouchableOpacity>
      <Text style={s.topTitle}>Mood History</Text>
      <TouchableOpacity onPress={onRefresh} style={s.refreshBtn}>
        <Text style={[s.refreshIco, refreshing && { opacity:0.4 }]}>↺</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:T.bg0 },
  center: { flex:1, justifyContent:'center', alignItems:'center', gap:12 },
  loadTxt: { fontSize:13, color:T.text3 },

  topBar: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:20, paddingVertical:13, backgroundColor:T.bg1, borderBottomWidth:1, borderBottomColor:T.border },
  backBtn: { padding:4 },
  backTxt: { fontSize:14, color:T.text3, fontWeight:'600' },
  topTitle: { fontSize:16, fontWeight:'800', color:T.text },
  refreshBtn: { padding:6 },
  refreshIco: { fontSize:22, color:T.violet, fontWeight:'700' },

  countRow: { paddingHorizontal:20, paddingTop:14 },
  countPill: { alignSelf:'flex-start', paddingHorizontal:12, paddingVertical:5, borderRadius:20, borderWidth:1 },
  countTxt: { fontSize:11, fontWeight:'700' },

  empty: { flex:1, justifyContent:'center', alignItems:'center', paddingHorizontal:32, gap:12 },
  emptyTitle: { fontSize:20, fontWeight:'800', color:T.text },
  emptySub: { fontSize:13, color:T.text3, textAlign:'center', lineHeight:19 },
  emptyBtn: { marginTop:8, paddingHorizontal:28, paddingVertical:12, borderRadius:12 },
  emptyBtnTxt: { fontSize:14, fontWeight:'800', color:T.bg0 },

  list: { paddingHorizontal:20, paddingTop:14 },

  card: { backgroundColor:T.bg2, borderRadius:18, borderWidth:1, borderColor:T.border, borderLeftWidth:3, borderLeftColor:T.violet, padding:16, marginBottom:12 },

  cardTop: { flexDirection:'row', alignItems:'center', gap:12, marginBottom:14 },
  moodCircle: { width:46, height:46, borderRadius:23, borderWidth:1.5, alignItems:'center', justifyContent:'center' },
  dateTxt: { fontSize:11, color:T.text3, marginBottom:4 },
  moodLbl: { fontSize:14, fontWeight:'800', textTransform:'capitalize' },
  confBadge: { paddingHorizontal:10, paddingVertical:4, backgroundColor:T.accentDim, borderRadius:10, borderWidth:1, borderColor:T.accent+'44' },
  confBadgeTxt: { fontSize:11, color:T.accent, fontWeight:'800' },

  div: { height:1, backgroundColor:T.border, marginBottom:14 },

  metrics: { flexDirection:'row', marginBottom:12 },
  metric: { flex:1, alignItems:'center', gap:4 },
  metricDiv: { width:1, backgroundColor:T.border },
  metricLbl: { fontSize:9, color:T.text3, fontWeight:'600', letterSpacing:0.5 },
  metricVal: { fontSize:10, fontWeight:'800', letterSpacing:0.5 },

  aiRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:T.amberDim, borderRadius:10, borderWidth:1, borderColor:T.amber+'40', paddingHorizontal:12, paddingVertical:8, marginBottom:12 },
  aiLbl: { fontSize:12, color:T.text3, fontWeight:'600' },
  aiVal: { fontSize:12, fontWeight:'800' },

  viewBtn: { flexDirection:'row', alignItems:'center', justifyContent:'center', paddingVertical:10, borderRadius:10, backgroundColor:T.violetDim, borderWidth:1, borderColor:T.violet+'40' },
  viewBtnTxt: { fontSize:12, fontWeight:'700' },
});