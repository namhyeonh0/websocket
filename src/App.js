import React, {useEffect, useRef, useState} from "react";
import axios from "axios";
import Chat from "./components/Chat";
import {Stomp} from "@stomp/stompjs";

const App = () => {
    const [token, setToken] = useState(""); // JWT 토큰
    const [chatRooms, setChatRooms] = useState([]); // 채팅방 목록
    const [selectedRoomId, setSelectedRoomId] = useState(null); // 선택된 채팅방 ID
    const [opposite, setOpposite] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("")
    const [stompClient, setStompClient] = useState(null);
    const [isLogined, setIsLogined] = useState(false);
    const [users, setUsers] = useState([]);
    const chosenRoomId = useRef(selectedRoomId);

    useEffect(() => {
        chosenRoomId.current = selectedRoomId;
    }, [selectedRoomId]);

    const fetchChatRooms = async (access) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/v1/chatrooms/user`, {
                headers: {Authorization: `${access}`},
            });
            setChatRooms(response.data);
        } catch (error) {
            console.error("Error fetching chat rooms:", error);
        }
    };

    let socket;
    const connectWebSocket = (access) => {
        console.log(`connect websocket, token: ${access}`);
        if (!socket || socket.readyState === WebSocket.CLOSED) {
            socket = new WebSocket(`ws://localhost:5000/ws?authorization=${access}`);
            const client = Stomp.over(socket);
            client.connect({Authorization: `${access}`}, () => {

                client.subscribe(`/user/queue/notifications`, (message) => {
                    const notice = JSON.parse(message.body);
                    alert(notice.content);
                    fetchChatRooms(access);
                });

                client.subscribe(`/user/queue/chatroom-close`, (message) => {
                    const notice = JSON.parse(message.body);
                    if (chosenRoomId.current === notice.chatRoomId) {
                        alert(notice.message);
                        setSelectedRoomId(null);
                    }
                    fetchChatRooms(access);
                });
            });
            setStompClient(client);
        }
    };

    const login = async (event) => {
        event.preventDefault();

        const formData = new URLSearchParams();
        formData.append('email', email);
        formData.append('password', password);
        try {
            const response = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData.toString(), // URL 인코딩된 데이터
                credentials: "include",
            });

            if (response.ok) {
                setIsLogined(true);
                const responseToken = response.headers.get("Authorization")
                setToken(response.headers.get("Authorization"));
                console.log(`로그인 성공: ${token}`);
                alert("로그인에 성공하셨습니다.");
                fetchUsersForChat(responseToken);
                fetchChatRooms(responseToken);
                connectWebSocket(responseToken);
            } else {
                const errorMessage = await response.text();
                console.error(`오류 발생: ${response.status} - ${errorMessage}`);
                alert(`로그인 실패: ${errorMessage.split("\"")[3]}`);
            }
        } catch (error) {
            console.error("로그인 요청 실패:", error);
            alert("로그인 요청 중 오류가 발생했습니다.");
        }
    };

    const createChatRoom = async (oppositeUser) => {
        try {
            const response = await axios.post(
                "http://localhost:5000/api/v1/chatrooms",
                {userEmail: email, oppositeEmail: oppositeUser},
                {headers: {Authorization: `${token}`}}
            );
            const newChatRoom = response.data;
            const isDuplicate = chatRooms.some((room) => room.chatRoomId === newChatRoom.chatRoomId);
            if (!isDuplicate) {
                setChatRooms([...chatRooms, newChatRoom]);
            }
            fetchChatRooms(token);
            setSelectedRoomId(response.data.chatRoomId);
        } catch (error) {
            console.error("Error creating chat room:", error);
        }
    };

    const fetchUsersForChat = async (access) => {
        try {
            const response = await axios.get(
                `http://localhost:5000/api/v1/users/chat-users`,
                {
                    headers: {Authorization: `${access}`},
                }
            );
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    return (
        <div>
            {!isLogined ? (
                <form onSubmit={login}>
                    <div>
                        <div>
                            <input
                                type="text"
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter Email"
                            />
                        </div>
                        <div>
                            <input
                                type="password"
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Password"
                            />
                        </div>
                    </div>
                    <button type="submit">Login</button>
                </form>
            ) : (
                <h2>채팅 서비스</h2>
            )
            }

            {(!selectedRoomId && isLogined) ? (
                <div>
                    <h1>채팅 가능 유저 목록</h1>
                    <ul>
                        {users.map((user) => (
                            <li key={user.email}>
                                <button onClick={() => {
                                    createChatRoom(user.email);
                                    setOpposite(user.email);
                                }}>
                                    {user.username}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <h1>참여중인 채팅방 목록</h1>
                </div>
            ) : (
                <div></div>
            )}


            {(!selectedRoomId) ? (
                <div>
                    <ul>
                        {chatRooms.map((room) => (
                            <li key={room.chatRoomId}>
                                <button onClick={() => {
                                    setSelectedRoomId(room.chatRoomId);
                                    setOpposite(room.oppositeEmail);
                                }}>
                                    {room.oppositeName}
                                </button>
                                <div>
                                {room.unReadCount}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <Chat
                    roomId={selectedRoomId}
                    token={token}
                    onLeaveRoom={() => {
                        setSelectedRoomId(null);
                        fetchChatRooms(token);
                    }}
                    email={email}
                    opposite={opposite}
                    stompClient={stompClient}
                />
            )}
        </div>
    );
};

export default App;
