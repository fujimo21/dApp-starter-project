import React, { useEffect, useState } from "react";
import "./App.css";
/* ethers 変数を使えるようにする*/
import { ethers } from "ethers";
import abi from "./utils/MedicalInfo.json";

const App = () => {
  
  const [currentAccount, setCurrentAccount] = useState("");
  /* ユーザーの名前と血液型を保存するために使用する状態変数を定義 */
  const [nameValue, setNameValue] = useState("");
  const [bloodValue, setBloodValue] = useState("");
  /* すべての医療情報を保存する状態変数を定義 */
  const [allDatas, setAllDatas] = useState([]);
  /* 一般ユーザーか医療従事者かを保存する状態変数を定義 */
  const [userType, setUserType] = useState("");
  /* 自分の医療情報を保存する状態変数を定義 */
  const [myDataValue, setMyDataValue] = useState([]);
  
  const contractAddress = "0x11B1D8cC9A04d4A58517133cbcf761DB825aa2FE";
  const contractABI = abi.abi;

  /* コントラクトからすべてのmdDatasを取得するメソッドを作成 */
  const getAllDatas = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const mdInfContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        /* コントラクトからgetAllDatasメソッドを呼び出す */
        const mdDatas = await mdInfContract.getAllDatas();
        /* UIに必要なのは、アドレス、タイムスタンプ、名前、血液型だけなので、以下のように設定 */
        const datasCleaned = mdDatas.map((mdData) => {
          return {
            patient: mdData.patient,
            timestamp: new Date(mdData.timestamp * 1000),
            name: mdData.name,
            blood: mdData.blood,
          };
        });
        /* React Stateにデータを格納する */
        setAllDatas(datasCleaned);
        console.log("Get datas success!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  /* コントラクトから自分の医療情報を取得するメソッドを作成 */
  const getMyData = async () => {
    const { ethereum } = window;
    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const mdInfContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        /* 自分の医療情報のIDを呼び出し */
        let i = await mdInfContract.myDataIndex();
        let index = ethers.BigNumber.from(i[0]).toNumber();
        let allDatas = await mdInfContract.getAllDatas();
        let myData = allDatas[index];
        /* UIに必要なのは、アドレス、タイムスタンプ、名前、血液型だけなので、以下のように設定 */
        const dataCleaned = {
          patient: myData.patient,
          timestamp: new Date(myData.timestamp * 1000),
          name: myData.name,
          blood: myData.blood,
        };
        /* React Stateにデータを格納する */
        setMyDataValue(dataCleaned);
        console.log("My Data is set");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };


  /**
   * `emit`されたイベントをフロントエンドに反映させる
   */
  useEffect(() => {
    let mdInfContract;

    const onNewData = (from, timestamp, name, blood) => {
      console.log("NewData", from, timestamp, name, blood);
      setAllDatas((prevState) => [
        ...prevState,
        {
          patient: from,
          timestamp: new Date(timestamp * 1000),
          name: name,
          blood: blood,
        },
      ]);
    };

    const onUpdateData = (from, timestamp, name, blood) => {
      console.log("UpdateData", from, timestamp, name, blood);
      const updateData = {
          patient: from,
          timestamp: new Date(timestamp * 1000),
          name: name,
          blood: blood,
      };
      setMyDataValue(updateData);
    };

    /* NewDataイベントやUpdateDataイベントがコントラクトから発信されたときに、情報をを受け取る */
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      mdInfContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      mdInfContract.on("NewData", onNewData);
      mdInfContract.on("updateData", onUpdateData);
    }
    
    return () => {
      if (mdInfContract) {
        mdInfContract.off("NewData", onNewData);
        mdInfContract.off("updateData", onUpdateData);
      }
    };

  }, []);

  /* window.ethereumにアクセスできることを確認する関数を実装 */
  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Make sure you have MetaMask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }
      /* ユーザーのウォレットへのアクセスが許可されているかどうかを確認 */
      const accounts = await ethereum.request({ method: "eth_accounts" });
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  /* connectWalletメソッド */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected: ", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  /* 一般ユーザーか医療従事者かのStateがセットされているかを確認する関数 */
  const checkUserType = async () => {
    try {
      /* ユーザーのウォレットへのアクセスが許可されているかどうかを確認 */
      if (userType == "") {
        console.log("User Type is not set");
      } else {
        console.log("This user is", userType);
      }
    } catch (error) {
      console.log(error);
    }
  };

  /* 一般ユーザーか医療従事者かをセットするメソッド */
  const selectUserType = async (type) => {
    try {
      if (type === "patient") {
        setUserType("patient");
      } else if(type === "mdProvider") {
        setUserType("mdProvider");
      } else {
        console.log("Unexpected user type");  
      }
    } catch (error) {
      console.log(error);
    }
    console.log("Connected as: ", userType);
  };
  
  /* 自分の医療情報を作成・更新する関数を実装 */
  const myData = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        /* ABIを参照 */
        const mdInfContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        /* コントラクトに名前と血液型を書き込む */
        const checkMyDataTxn = await mdInfContract.checkMyData(nameValue, bloodValue, {
          gasLimit: 300000,
        });
        console.log("Mining...", checkMyDataTxn.hash);
        await checkMyDataTxn.wait();
        console.log("Mined -- ", checkMyDataTxn.hash);
        
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  /* useState更新のデバッグ用 */
  // const checkConsole = () => {
  //   console.log("my data value",myDataValue);
  //   console.log("all datas",allDatas);
  // }

  /* WEBページがロードされたときに関数を実行 */
  useEffect(() => {
    checkIfWalletIsConnected();
    checkUserType();
    getAllDatas();
    getMyData();
  }, []);

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          WELCOME!
        </div>
        <div className="bio">
          イーサリアムウォレットを接続して、患者か医療従事者か選択してください
        </div>
        <br />
        {/* ウォレットコネクトのボタン */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        {currentAccount && (
          <button className="waveButton">Wallet Connected</button>
        )}

        {/*デバッグ用*/}
        {/* <button className="waveButton" onClick={checkConsole}>Console</button> */}
        
        {/* 一般ユーザーか医療従事者か選択 */}
        {currentAccount && !userType && (
          <div>
            <h2>I'm a</h2>
            <div className="container">
              <button className="selectButton" onClick={() => selectUserType('patient')}>
                Patient
              </button>
              <button className="selectButton" onClick={() => selectUserType('mdProvider')}>
                Medical Provider
              </button>
            </div>
          </div>
        )}        

        {/* UpdateボタンにmyData関数を連動 */}
        {userType == "patient" && (
          <button className="waveButton" onClick={myData}>
            Update Your Information
          </button>
        )}
        {/* 自分の医療情報入力フォームを実装*/}
        {userType == "patient" && (
          <textarea
            name="nameArea"
            placeholder="名前はこちら"
            type="text"
            id="name"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
          />
        )}
        {userType == "patient" && (
          <textarea
            name="bloodArea"
            placeholder="血液型はこちら"
            type="text"
            id="blood"
            value={bloodValue}
            onChange={(e) => setBloodValue(e.target.value)}
          />
        )}

        {/* 一般ユーザーなら自分の情報を表示する */}
        {myDataValue ? (
          currentAccount && userType == "patient" && 
            <div
              style={{
                backgroundColor: "#F8F8FF",
                marginTop: "16px",
                padding: "8px",
              }}
            >
              <div>名前: {myDataValue.name}</div>
              <div>血液型: {myDataValue.blood}</div>
              <div>最終更新日: {myDataValue.timestamp.toString()}</div>
            </div>
          ) : (
            currentAccount && userType == "patient" &&
            <div>No Data</div>
          )  
        }

        {/* 医療従事者なら全ての履歴を表示する */}
        {allDatas.length > 0 ? (
          currentAccount && userType == "mdProvider" && 
            allDatas
            .slice(0)
            .reverse()
            .map((mdData, index) => {
              return (
                <div
                  key={index}
                  style={{
                    backgroundColor: "#F8F8FF",
                    marginTop: "16px",
                    padding: "8px",
                  }}
                >
                  <div>名前: {mdData.name}</div>
                  <div>血液型: {mdData.blood}</div>
                  <div>最終更新日: {mdData.timestamp.toString()}</div>
                </div>
              ); 
            })
          ) : (
            currentAccount && userType == "mdProvider" &&
            <div>No Data</div>
          )  
        }
    
      </div>
    </div>
  );
};
export default App;