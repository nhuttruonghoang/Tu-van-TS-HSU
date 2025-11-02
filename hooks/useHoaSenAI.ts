import { useState, useRef, useCallback, useEffect } from 'react';
// FIX: Removed LiveSession as it is not an exported member.
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConversationState, TranscriptEntry } from '../types';
import { decode, decodeAudioData, createPcmBlob } from '../utils/audioUtils';

const SYSTEM_INSTRUCTION = `Bạn là một chuyên gia tư vấn tuyển sinh AI của trường Đại học Hoa Sen.
Nhiệm vụ của bạn là CHỈ cung cấp thông tin dựa trên dữ liệu được cung cấp dưới đây. TUYỆT ĐỐI KHÔNG được sử dụng kiến thức bên ngoài hoặc tự bịa đặt thông tin không có trong tài liệu. Nếu không tìm thấy thông tin, hãy trả lời rằng "Tôi chưa có thông tin về vấn đề này, bạn vui lòng liên hệ phòng tuyển sinh để được hỗ trợ chi tiết."
Luôn trả lời bằng tiếng Việt, giữ thái độ thân thiện, chuyên nghiệp và chính xác.

--- DỮ LIỆU TUYỂN SINH ĐẠI HỌC HOA SEN 2024 ---

**1. THÔNG TIN CHUNG:**
- Tên trường: Đại học Hoa Sen (HSU)
- Mã trường: DTH
- Website: hoasen.edu.vn

**2. CÁC PHƯƠNG THỨC XÉT TUYỂN NĂM 2024:**
- **Phương thức 1:** Xét tuyển trên kết quả Kỳ thi Tốt nghiệp Trung học Phổ thông (THPT) năm 2024. Điểm xét tuyển là tổng điểm các môn trong tổ hợp xét tuyển.
- **Phương thức 2:** Xét tuyển trên kết quả học bạ THPT. Có 3 hình thức:
    + Dựa vào kết quả học tập 3 năm THPT.
    + Dựa vào kết quả học tập 5 học kỳ (Lớp 10, Lớp 11, và Học kỳ I Lớp 12).
    + Dựa vào kết quả học tập 3 môn của Lớp 12.
- **Phương thức 3:** Xét tuyển thẳng theo quy chế của Bộ Giáo dục & Đào tạo (GD&ĐT) và quy định của Đại học Hoa Sen.
- **Phương thức 4:** Xét tuyển trên kết quả kỳ thi Đánh giá năng lực của Đại học Quốc gia TP. HCM năm 2024.

**3. HỌC PHÍ DỰ KIẾN NĂM HỌC 2024-2025:**
- Học phí được tính theo tín chỉ, trung bình một năm học khoảng 75 - 90 triệu VNĐ tùy theo ngành và lộ trình học.
- Một số ngành tham khảo:
    + Công nghệ thông tin: ~85 triệu VNĐ/năm.
    + Thiết kế đồ họa: ~90 triệu VNĐ/năm.
    + Quản trị khách sạn: ~80 triệu VNĐ/năm.
    + Ngôn ngữ Anh: ~78 triệu VNĐ/năm.
- Lưu ý: Mức học phí này là dự kiến và có thể được điều chỉnh.

**4. CHÍNH SÁCH HỌC BỔNG NĂM 2024:**
- **Học bổng Tài năng:** Trị giá 100% học phí toàn khóa. Dành cho thí sinh có thành tích xuất sắc trong học tập, các cuộc thi quốc gia, quốc tế.
- **Học bổng Khuyến học:** Trị giá 25%, 50%, hoặc 75% học phí năm học đầu tiên. Dựa trên điểm xét tuyển đầu vào.
- **Học bổng Doanh nghiệp:** Học bổng từ các công ty đối tác, dành cho sinh viên các ngành cụ thể như Logistics, Marketing, Công nghệ thông tin.
- **Học bổng "Người Hoa Sen":** Ưu đãi học phí cho người thân của cựu sinh viên, cán bộ, giảng viên của trường.

**5. CÁC NGÀNH ĐÀO TẠO NỔI BẬT:**
- Công nghệ thông tin (An toàn thông tin, Kỹ thuật phần mềm, Trí tuệ nhân tạo)
- Thiết kế (Thiết kế đồ họa, Thiết kế nội thất, Thiết kế thời trang)
- Kinh tế & Quản trị (Quản trị kinh doanh, Marketing, Logistics và Quản lý chuỗi cung ứng)
- Du lịch & Khách sạn (Quản trị khách sạn, Quản trị sự kiện)
- Ngôn ngữ & Xã hội (Ngôn ngữ Anh, Tâm lý học)

**6. ĐỜI SỐNG SINH VIÊN:**
- Môi trường học tập năng động, quốc tế.
- Hơn 50 câu lạc bộ, đội, nhóm đa dạng các lĩnh vực.
- Cơ sở vật chất hiện đại tại trung tâm TP.HCM.
- Chú trọng trải nghiệm thực tế và kết nối doanh nghiệp.

--- HẾT DỮ LIỆU ---

Khi bắt đầu cuộc hội thoại, hãy chào mừng người dùng và giới thiệu bản thân một cách ngắn gọn. Ví dụ: "Xin chào, tôi là trợ lý tuyển sinh AI của Đại học Hoa Sen. Tôi có thể giúp gì cho bạn?"`;

export const useHoaSenAI = () => {
  const [conversationState, setConversationState] = useState<ConversationState>(ConversationState.IDLE);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // FIX: Using `any` because `LiveSession` type is not exported from the library.
  const sessionRef = useRef<any | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const cleanup = useCallback(() => {
    scriptProcessorRef.current?.disconnect();
    mediaStreamSourceRef.current?.disconnect();
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    streamRef.current?.getTracks().forEach(track => track.stop());

    sessionRef.current?.close();

    sessionRef.current = null;
    sessionPromiseRef.current = null;
    inputAudioContextRef.current = null;
    outputAudioContextRef.current = null;
    streamRef.current = null;
    scriptProcessorRef.current = null;
    mediaStreamSourceRef.current = null;
  }, []);

  const startConversation = useCallback(async () => {
    setError(null);
    setTranscript([]);
    setConversationState(ConversationState.CONNECTING);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setConversationState(ConversationState.ACTIVE);
            const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
            mediaStreamSourceRef.current = source;
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              sessionPromiseRef.current?.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcription
            if (message.serverContent?.inputTranscription) {
              currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
            }
            if (message.serverContent?.turnComplete) {
                const userInput = currentInputTranscriptionRef.current.trim();
                const modelOutput = currentOutputTranscriptionRef.current.trim();
                
                // FIX: Refactored to prevent TypeScript from incorrectly inferring the speaker type as `string`.
                // This more explicit approach ensures type safety.
                if (userInput || modelOutput) {
                    setTranscript(prev => {
                        const updatedTranscript = [...prev];
                        if (userInput) {
                            updatedTranscript.push({ id: Date.now(), speaker: 'user', text: userInput });
                        }
                        if (modelOutput) {
                            updatedTranscript.push({ id: Date.now() + 1, speaker: 'model', text: modelOutput });
                        }
                        return updatedTranscript;
                    });
                }

                currentInputTranscriptionRef.current = '';
                currentOutputTranscriptionRef.current = '';
            }
            
            // Handle Audio
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
                const audioBuffer = await decodeAudioData(
                    decode(base64Audio),
                    outputAudioContextRef.current,
                    24000,
                    1
                );

                const source = outputAudioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContextRef.current.destination);
                
                const currentTime = outputAudioContextRef.current.currentTime;
                const startTime = Math.max(nextStartTimeRef.current, currentTime);
                
                source.start(startTime);
                nextStartTimeRef.current = startTime + audioBuffer.duration;
                audioSourcesRef.current.add(source);
                source.onended = () => {
                    audioSourcesRef.current.delete(source);
                };
            }

            if (message.serverContent?.interrupted) {
                for (const source of audioSourcesRef.current.values()) {
                    source.stop();
                }
                audioSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            cleanup();
            setConversationState(ConversationState.IDLE);
          },
          onerror: (e) => {
            console.error(e);
            setError('Đã xảy ra lỗi kết nối.');
            cleanup();
            setConversationState(ConversationState.ERROR);
          },
        },
      });
      sessionPromiseRef.current = sessionPromise;
      sessionRef.current = await sessionPromise;
      
    } catch (err) {
      console.error(err);
      setError('Không thể truy cập micro. Vui lòng cấp quyền và thử lại.');
      setConversationState(ConversationState.ERROR);
    }
  }, [cleanup]);

  const stopConversation = useCallback(() => {
    cleanup();
    setConversationState(ConversationState.IDLE);
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { conversationState, transcript, error, startConversation, stopConversation };
};