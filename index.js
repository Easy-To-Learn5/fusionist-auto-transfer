const ethers = require('ethers');
const fetch = require('node-fetch');
const fs = require('fs-extra');
const readline = require('readline-sync');

const functionSendTransaction = (signedAce) => new Promise(async(resolve, reject) => {
    const bodys = {
        jsonrpc: '2.0',
        method: 'eth_sendRawTransaction',
        params: [signedAce],
        id: 43,
    }

    fetch(`https://rpc-endurance.fusionist.io/`, { 
        method: 'POST',
        body: JSON.stringify(bodys),
        headers: {
            'content-type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(result => {
        resolve(result);
    })
    .catch(err => reject(err))
});

const functionGetBalance = (address) => new Promise(async(resolve, reject) => {
    const bodys = {
        "method":"eth_getBalance",
        "params":[
            address,
            "latest"
        ],
        "id":50,
        "jsonrpc":"2.0"
    }

    fetch(`https://rpc-endurance.fusionist.io/`, { 
        method: 'POST',
        body: JSON.stringify(bodys),
        headers: {
            'content-type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(result => {
        resolve(result);
    })
    .catch(err => reject(err))
});

const functionTxCount = (address) => new Promise(async(resolve, reject) => {
    const bodys = {
        jsonrpc: '2.0',
        method: 'eth_getTransactionCount',
        params: [address, 'latest'],
        id: 43,
    }

    fetch(`https://rpc-endurance.fusionist.io/`, { 
        method: 'POST',
        body: JSON.stringify(bodys),
        headers: {
            'content-type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(result => {
        resolve(result);
    })
    .catch(err => reject(err))
});

(async () => {
    const file = readline.question("File: ")
    const mainAddress = readline.question("Address utama (penampung): ")
    const listCode = await fs.readFile(`./${file}`, "utf-8")
    const toArray = listCode.split('\r\n')
    let i = 0
    console.log("")
    while(toArray.length != i){
        try {
            let pharse = toArray[i]

            let wallet

            if(pharse.includes(" ")){
                wallet = new ethers.Wallet.fromMnemonic(pharse)
            } else {
                wallet = new ethers.Wallet(pharse)
            }

            const address = wallet.address
            const getBalance = await functionGetBalance(address)
            const balance = ethers.utils.formatEther(getBalance.result);

            console.log(`[${i}] ${pharse} | ${balance} ACE`)

            if(balance >= 0.01){
                const balanceFee = ethers.utils.parseEther('0.011')
                const parseEther = ethers.utils.parseUnits(balance)
                const convertFinalBalance = parseEther.sub(balanceFee);

                const getNonce = await functionTxCount(address)

                const transaction = {
                    from: address,
                    nonce: getNonce.result,
                    to: mainAddress,
                    value: convertFinalBalance,
                    gasLimit: 21000,
                    gasPrice: ethers.utils.parseUnits("1.0", "gwei"),
                    chainId: 648
                };
      
                const signedAce = await wallet.signTransaction(transaction);
                const transferAce = await functionSendTransaction(signedAce)
                if(transferAce?.result){
                    console.log(`[${i}] Transfer berhasil => TX HASH ${transferAce.result}`)
                } else {
                    console.log(`[${i}] Transfer gagal, ${transferAce.error.message}`)
                }
                i++
            } else {
                i++
                console.log(`[${i}] Balance kurang !!`)
            }
            console.log("")
        } catch (error) {
            console.log(error)
            console.log(`Error: ${error}`)
        }
    }
})();