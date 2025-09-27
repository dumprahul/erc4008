import Agent from './src/0gAgentSdk.js'

// Import wallet
Agent.importWallet('203dd76c96385bd9fbedde26a6dd9bb27ce57f2c9407777d7905535e16abb542')

console.log('🔥 Testing all 6 IdentityRegistry functions...\n')

try {
  // Get the wallet address to ensure consistency
 

  

  // 1. REGISTER AGENT (must use wallet address)
  console.log('1️⃣ Testing registerAgent...')
  const agent = new Agent({
    domain: 'test16.com',
    address: '0xfa7B05d303014bA3C81759CC1310a9bB601bf2d0'  // Use wallet address!
  })
  
  const registerResult = await agent.register()
  console.log('✅ Register result:', registerResult)
  console.log('Agent ID:', agent.agentId)
  console.log()

  // 2. GET AGENT
  console.log('2️⃣ Testing getAgent...')
  const agentInfo = await agent.getInfo()
  console.log('✅ Agent info:', agentInfo)
  console.log()

  // 3. AGENT EXISTS
  console.log('3️⃣ Testing agentExists...')
  const exists = await agent.exists()
  console.log('✅ Agent exists:', exists)
  console.log()

  // 4. RESOLVE BY DOMAIN
  console.log('4️⃣ Testing resolveByDomain...')
  const domainResult = await Agent.resolveByDomain('test16.com')
  console.log('✅ Resolve by domain:', domainResult)
  console.log()

  // 5. RESOLVE BY ADDRESS
  console.log('5️⃣ Testing resolveByAddress...')
  const addressResult = await Agent.resolveByAddress('0xfa7B05d303014bA3C81759CC1310a9bB601bf2d0')
  console.log('✅ Resolve by address:', addressResult)
  console.log()

  // 6. UPDATE AGENT (now should work since wallet == registered address)
  console.log('6️⃣ Testing updateAgent...')
  const newDomain = `${testDomain}-updated`
  const updateResult = await agent.update(newDomain, walletAddress)
  console.log('✅ Update result:', updateResult)
  console.log()

  // BONUS: Check updated info
  console.log('🔍 Checking updated agent info...')
  const updatedInfo = await agent.getInfo()
  console.log('✅ Updated agent info:', updatedInfo)

} catch (error) {
  console.error('❌ Test failed:', error.message)
}