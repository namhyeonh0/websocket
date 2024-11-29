// import React, { useState, useEffect } from 'react';
// import SockJS from 'sockjs-client';
// import { Client } from '@stomp/stompjs';
//
// const ChatComponent = () => {
//     const [stompClient, setStompClient] = useState(null);  // STOMP 클라이언트
//     const [messages, setMessages] = useState([]);  // 메시지 목록
//     const [messageContent, setMessageContent] = useState('');  // 입력한 메시지
//     const [username, setUsername] = useState('');  // 사용자의 이름
//     const [recipient, setRecipient] = useState('');  // 상대방의 이름
//     const [connected, setConnected] = useState(false); // WebSocket 연결 상태
//
//     useEffect(() => {
//         const socket = new SockJS('http://localhost:5000/ws');  // WebSocket 서버 URL
//
//         // STOMP 클라이언트 초기화
//         const client = new Client({
//             brokerURL: 'ws://localhost:5000/ws', // STOMP 서버 URL
//             connectHeaders: {},
//             debug: (str) => {
//                 console.log(str);
//             },
//             onConnect: () => {
//                 setConnected(true);
//                 if (recipient) {
//                     // 상대방에 대한 메시지 구독
//                     client.subscribe(`/topic/${recipient}`, (message) => {
//                         const newMessage = JSON.parse(message.body);
//                         setMessages((prevMessages) => [...prevMessages, newMessage]);
//                     });
//                 }
//             },
//             onDisconnect: () => {
//                 setConnected(false);
//             },
//             onStompError: (frame) => {
//                 console.error(`STOMP error: ${frame}`);
//             },
//         });
//
//         // 클라이언트 연결
//         client.activate();
//         setStompClient(client);
//
//         return () => {
//             if (client) {
//                 client.deactivate();  // 연결 종료 시 클라이언트 비활성화
//             }
//         };
//     }, [recipient]);  // recipient가 바뀔 때마다 다시 구독
//
//     const sendMessage = () => {
//         if (stompClient && messageContent.trim() && username && recipient) {
//             // 메시지 전송
//             stompClient.publish({
//                 destination: '/app/chat/send',  // 서버에서 메시지를 받을 엔드포인트
//                 body: JSON.stringify({
//                     message: messageContent,
//                     sender: username,
//                     recipient: recipient,
//                 })
//             });
//             setMessageContent('');
//         }
//     };
//
//     return (
//         <div>
//             <h2>1:1 채팅</h2>
//             <div>
//                 <label>Username: </label>
//                 <input
//                     type="text"
//                     value={username}
//                     onChange={(e) => setUsername(e.target.value)}
//                     placeholder="사용자 이름"
//                 />
//             </div>
//             <div>
//                 <label>Recipient: </label>
//                 <input
//                     type="text"
//                     value={recipient}
//                     onChange={(e) => setRecipient(e.target.value)}
//                     placeholder="상대방 이름"
//                 />
//             </div>
//             {connected ? (
//                 <div>
//                     <div
//                         style={{
//                             border: '1px solid #ddd',
//                             height: '300px',
//                             overflowY: 'scroll',
//                             marginBottom: '10px',
//                         }}
//                     >
//                         {messages.map((msg, index) => (
//                             <div key={index}>
//                                 <strong>{msg.sender}: </strong>{msg.message}
//                             </div>
//                         ))}
//                     </div>
//                     <div>
//                         <input
//                             type="text"
//                             value={messageContent}
//                             onChange={(e) => setMessageContent(e.target.value)}
//                             placeholder="메시지 입력"
//                         />
//                         <button onClick={sendMessage}>Send</button>
//                     </div>
//                 </div>
//             ) : (
//                 <div>서버와의 연결이 끊어졌습니다. 다시 시도해 주세요.</div>
//             )}
//         </div>
//     );
// };
//
// export default ChatComponent;
