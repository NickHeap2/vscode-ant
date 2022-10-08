const java = require('java')
const { exit } = require('process')
java.asyncOptions = {
  asyncSuffix: undefined,     // Don't generate node-style methods taking callbacks
  syncSuffix: "",              // Sync methods use the base name(!!)
  promiseSuffix: "Promise",   // Generate methods returning promises, using the suffix Promise.
  promisify: require('util').promisify // Needs Node.js version 8 or greater, see comment below
}
java.classpath.push('./apache-ant/lib/')
java.classpath.push('./apache-ant/lib/ant.jar')
java.classpath.push('./apache-ant/lib/ant-launcher.jar')

const Project = java.import('org.apache.tools.ant.Project')
const File = java.import('java.io.File')
const ProjectHelper = java.import('org.apache.tools.ant.ProjectHelper')

async function getTargets () {
  const targets = []

  const project = new Project()
  const file = new File('test_with_vars/build.xml')
  const projectHelper = new ProjectHelper()

  await java.callMethodPromise(projectHelper, 'configureProject', project, file)

  const projectName = project.getName()
  const projectDescription = project.getDescription()
  const defaultTarget = project.getDefaultTarget()

  const targetsHashtable = project.getTargets()

  // console.log(projectName)
  // console.log(projectDescription)
  // console.log(defaultTarget)

  // console.log(targetsHashtable.sizeSync())
  // console.log(targetsHashtable.toStringSync())

  const keys = targetsHashtable.keys()
  while(keys.hasMoreElements()) {
    const targetName = keys.nextElement()

    if (!targetName || targetName.startsWith(projectName)) {
      continue
    }

    // console.log(key)
    const target = targetsHashtable.get(targetName)
    // console.log(`[${targetName}] Location: ${target.getLocation()}`)

    const dependencies = target.getDependencies()

    const depends = []
    while(dependencies.hasMoreElements()) {
    // while(true) {
      try {
        const dependency = dependencies.nextElement()
        depends.push(dependency)
        // console.log(`    ${dependency}`)
      } catch(e) {
        break
      }
    }
    // console.log(target.dependencies)

    targets.push({ name: targetName, location: target.getLocation().getFileName(), description: target.getDescription(), dependencies: depends})

  }
  return targets
}

(async () => {
  try {
      const targets = await getTargets()
      // console.log(targets)
      for(const target of targets) {
        console.log(target)
      }
  } catch (e) {
      // Deal with the fact the chain failed
      console.log(e)
  }

  console.log('Yayya!')

  exit(0)
})();

