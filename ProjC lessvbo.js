/**
 * @Author Haoyu Wei
 * @Date 27 Nov 2019
 * @Note Project C
 */

 /** Global Variables */
 // For Multiple Shaders
worldBox = new VBObox00();  // Without Lighting
partBox1 = new VBObox1();  // Without Lighting
partBox2 = new VBObox2();  // With Grouroud Shading
partBox3 = new VBObox3();  // With Phong Shading

var g_show00 = 1;
var g_show1 = 1;
var g_show2 = 0;
var g_show3 = 0;

// For 3D shapes
var floatsPerVertex = 10; 

 // For animation
var currentAngle = 0.0;
var walkAngle = 0.0;
var flyAngle = 0.0;
var sphAngle = 0.0;

var ANGLE_STEP = 45.0;
var walk_ANGLE_STEP = 30.0;	
var fly_ANGLE_STEP = 60.0;
var sph_ANGLE_STEP = 30.0;

var rRobot = true; // if rotate whole robot
var rLArm = true;  // robot left arm
var rRArm = true;  // robot right arm
var rHead = true; // robot head
var rLower = true; // robot lower body
var rThing = true;  // thing the robot holds
var bowStart = false;  // if start bowing
var walkStart = false;  // if start walking continuously
var stepStart = false;  // if start walking step by step
var flyStart = true;  // if helicopter start flying
var walkTmp = walk_ANGLE_STEP;
var direction = 1.0;  // direction & flag of robot walking. 1 is walking around. +/-90 is right/left. 0/180 is foward/back.
var currLocX = 0.0;  // current walking location on X axis.
var currLocZ = 0.0;  // current walking location on Z axis.
var shapeChange = false;  // whether helicopter has changed shape.
var hold;
var open = false;

// Mouse click and drag
var isDrag=false;
var xMclik=0.0;
var yMclik=0.0;   
var xMdragTot=0;
var yMdragTot=0; 

// View & Projection
var eyeX = 0.0;
var eyeY = 5.0;
var eyeZ = 1.0;
var atX = 0.0;
var atY = 0.0;
var atZ = 1.0;
var theta = 0.0;  // turn camera horizontally to angle theta
var r = eyeY-atY;  // radius of camera cylinder
var tilt = 0.0;

var fLeft = -2.0;  // frustum paras
var fRight = 2.0;
var fBottom = -2.0;
var fTop = 2.0;
var fNear = 3.0;
var fFar = 100.0; 
var frustum = false;

function main(){
    canvas = document.getElementById('gl_canvas');
    gl = getWebGLContext(canvas);
    ctx = canvas.getContext("2d", {preserveDrawingBuffer: true});
    if (!gl){
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    worldBox.init(gl);
    partBox1.init(gl);
    partBox2.init(gl);
    partBox3.init(gl);

    normalMatrix = new Matrix4();
    vpMatrix = new Matrix4();
    mvpMatrix = new Matrix4();
    // Event register
    window.addEventListener("mousedown", myMouseDown);
    window.addEventListener("mousemove", myMouseMove);
    window.addEventListener("mouseup", myMouseUp);
    window.addEventListener("keydown", myKeyDown, false);	

    // Dat.gui
    var GUIContent = function() {
        this.stopRobot = function(){runStop()};
        this.walk = function(){walkEvent()};
        this.walkSpeed = 30;
        this.bow = function(){bowEvent()};
        // this.hold = '--select--';
        this.stopHelicopter = function(){runStopHeli()};
        this.speed = 60;
        this.shapeChange = function(){shapeChange = !shapeChange};
        this.frustum = false;
        this.left = -2.0;
        this.right = 2.0;
        this.bottom = -2.0;
        this.top = 2.0;
        this.near = 3.0;
        this.far = 100.0;
        this.attenuation = 'none';
        this.lampCameraOn = true;
        this.lampWorldOn = true;
        this.ambient0 = true;
        this.diffuse0 = true;
        this.specular0 = true;
        this.ambient1 = true;
        this.diffuse1 = true;
        this.specular1 = true;
      };
      
    var text = new GUIContent();
    var gui = new dat.GUI();

    var robot = gui.addFolder('Robot');
    robot.add(text, 'stopRobot');
    robot.add(text, 'bow');
    robot.add(text, 'walk');
    robot.add(text, 'walkSpeed', 1, 60).onChange(function(newValue){
        if (walk_ANGLE_STEP > 0){
            walk_ANGLE_STEP = newValue; 
        }else{
            walk_ANGLE_STEP = -newValue;
        }
    });
    // robot.add(text, 'hold', ['Torus', 'Umbrella']).onChange(function(newValue){hold = newValue;}).listen();
    // robot.open();

    var heli = gui.addFolder('Helicopter');
    heli.add(text, 'stopHelicopter');
    heli.add(text, 'speed', 20, 100).onChange(function(newValue){fly_ANGLE_STEP = newValue;});
    heli.add(text, 'shapeChange');
    // heli.open();

    var view = gui.addFolder('View');
    view.add(text, 'frustum').onChange(function(){frustum = !frustum});
    view.add(text, 'left').onChange(function(newValue){fLeft = newValue;});
    view.add(text, 'right').onChange(function(newValue){fRight = newValue;});
    view.add(text, 'bottom').onChange(function(newValue){fBottom = newValue;});
    view.add(text, 'top').onChange(function(newValue){fTop = newValue;});
    view.add(text, 'near').onChange(function(newValue){fNear = newValue;});
    view.add(text, 'far').onChange(function(newValue){fFar = newValue;});

    var lamp = gui.addFolder('Lamps');
    lamp.add(text, 'attenuation', ['none', '1/dis', '1/(dis*dis)']).onChange(function(newValue){
        if (newValue == 'none'){
            whichAttFunc = 0;
        }else if(newValue == '1/dis'){
            whichAttFunc = 1;
        } else if (newValue == '1/(dis*dis)'){
            whichAttFunc = 2;
        }
    })
    var lampWorld = lamp.addFolder('lampWorld');
    lampWorld.add(text, 'lampWorldOn').onChange(function(){lamp0On = !lamp0On;});
    lampWorld.add(text, 'ambient0').onChange(function(newValue){
        if(newValue){
            lamp0.I_ambi.elements.set(amb);
            console.log(amb);
        }else{
            lamp0.I_ambi.elements.set(dark);
        }
    });
    lampWorld.add(text, 'diffuse0').onChange(function(newValue){
        if(newValue){
            lamp0.I_diff.elements.set(dif);
        }else{
            lamp0.I_diff.elements.set(dark);
        }
    });
    lampWorld.add(text, 'specular0').onChange(function(newValue){
        if(newValue){
            lamp0.I_spec.elements.set(spe);
        }else{
            lamp0.I_spec.elements.set(dark);
        }
    });
    var lampCamera = lamp.addFolder('lampCamera');
    lampCamera.add(text, 'lampCameraOn').onChange(function(){lamp1On = !lamp1On;});
    lampCamera.add(text, 'ambient1').onChange(function(newValue){
        if(newValue){
            lamp1.I_ambi.elements.set(amb);
            console.log(amb);
        }else{
            lamp1.I_ambi.elements.set(dark);
        }
    });
    lampCamera.add(text, 'diffuse1').onChange(function(newValue){
        if(newValue){
            lamp1.I_diff.elements.set(dif);
        }else{
            lamp1.I_diff.elements.set(dark);
        }
    });
    lampCamera.add(text, 'specular1').onChange(function(newValue){
        if(newValue){
            lamp1.I_spec.elements.set(spe);
        }else{
            lamp1.I_spec.elements.set(dark);
        }
    });
    lamp.open();
    lampCamera.open();
    lampWorld.open();

    gl.clearColor(0.53, 0.8, 0.92, 1.0);
    gl.enable(gl.DEPTH_TEST); 

    var tick = function() {
        currentAngle = animate(currentAngle);  // Update the rotation angle
        walkAngle = animateWalk(walkAngle); 
        flyAngle = animateFly(flyAngle);
        sphAngle = animateSphere(sphAngle);
        drawResize();
        requestAnimationFrame(tick, canvas);   
    };
    tick();	
}

function drawResize(){
    var nuCanvas = document.getElementById('gl_canvas');	// get current canvas
    var nuGl = getWebGLContext(nuCanvas);
    
    nuCanvas.width = innerWidth - 16;
    nuCanvas.height = innerHeight*3/4 - 16;

    drawAll(nuGl);
}

function drawAll(gl){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight); 
    if (frustum){
        vpMatrix.setFrustum(fLeft,fRight,fBottom,fTop,fNear,fFar);
    } else{
        var ratio = canvas.width/canvas.height;
        vpMatrix.setPerspective(30, ratio, 1, 100);
    }
    vpMatrix.lookAt(eyeX,eyeY,eyeZ, atX,atY,atZ, 0.0,0.0,1.0);  

    if (g_show00){
        worldBox.switchToMe();  
        worldBox.adjust();
        worldBox.draw();
    }
    if (g_show1){
        partBox1.switchToMe();  
        partBox1.adjust();
        partBox1.draw();
    }
    if (g_show2){
        partBox2.switchToMe();  
        partBox2.adjust();
        partBox2.draw();
    }
    if (g_show3){
        partBox3.switchToMe();  
        partBox3.adjust();
        partBox3.draw();
    }
}

/*************Animations here***************/
var g_last = Date.now();
function animate(angle) {
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;

 if(angle >  50.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
 if(angle < -50.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360*3;
}

var g_last1 = Date.now();
function animateWalk(angle) {
    var now = Date.now();
    var elapsed = now - g_last1;
    g_last1 = now;
  
   if(angle >=  180.0 && walk_ANGLE_STEP > 0) walk_ANGLE_STEP = -walk_ANGLE_STEP;
   if(angle <=  -180.0 && walk_ANGLE_STEP < 0) walk_ANGLE_STEP = -walk_ANGLE_STEP;
    
    var newAngle = angle + (walk_ANGLE_STEP * elapsed) / 1000.0;
    return newAngle %= 360*3;
}

var g_last2 = Date.now();
function animateFly(angle) {
    var now = Date.now();
    var elapsed = now - g_last2;
    g_last2 = now;
  
//    if(angle >=  180.0 && fly_ANGLE_STEP > 0) fly_ANGLE_STEP = -fly_ANGLE_STEP;
//    if(angle <=  -180.0 && fly_ANGLE_STEP < 0) fly_ANGLE_STEP = -fly_ANGLE_STEP;
    
    var newAngle = angle + (fly_ANGLE_STEP * elapsed) / 1000.0;
    return newAngle %= 360*3;
}

var g_last3 = Date.now();
function animateSphere(angle) {
  var now = Date.now();
  var elapsed = now - g_last3;
  g_last3 = now;

  var newAngle = angle + (sph_ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360*3;
}

function walkAround(modelMatrix){
    rRobot = false;
    rHead = false;
    if (direction == 1){  // not specified. walk around
        modelMatrix.translate(-walkAngle/200, 0.0, 0.0);
        // left
        if (walk_ANGLE_STEP>0 || (walk_ANGLE_STEP==0 && walkTmp >0)){
            modelMatrix.rotate(90, 0,1,0);
        }else{  // right
            modelMatrix.rotate(-90, 0,1,0);
        }
    } else {  // walk a step
        modelMatrix.translate(currLocX, 0.0, currLocZ);
        modelMatrix.rotate(direction, 0,1,0);
    }
    return modelMatrix;
}

function bow(modelMatrix, bowAngle){
    if (bowAngle<0){
        modelMatrix.translate(0.0, -unitLen*0.1, 0.0);
        modelMatrix.rotate(bowAngle, 1,0,0);
        modelMatrix.translate(0.0, unitLen*0.1, 0.0);
    }
}

function flyAround(modelMatrix){
    if (flyAngle < 180 || (flyAngle>360 && flyAngle<540) || (flyAngle>720 && flyAngle<900)){
        modelMatrix.translate(Math.cos(flyAngle/360*6)*1.8-0.1, 0, Math.sin(flyAngle/360*6)*0.5);
    } else{
        modelMatrix.rotate(180, 0,1,0);
        modelMatrix.translate(-Math.cos(flyAngle/360*6)*1.9-0.1, 0, -Math.sin(flyAngle/360*6)*0.5);
    }
}

/*************Make shapes here***************/
function makeGroundGrid(){
    var xcount = 100;
    var ycount = 100;		
    var xymax	= 50.0;
    var xColr = new Float32Array([1.0, 1.0, 0.3]);
    var yColr = new Float32Array([0.5, 1.0, 0.5]);
    gndVerts =  new Float32Array(7*2*(xcount+ycount));
    var xgap = xymax/(xcount-1);
    var ygap = xymax/(ycount-1);
    for(v=0, j=0; v<2*xcount; v++, j+= 7) {
        if(v%2==0) {
            gndVerts[j  ] = -xymax + (v)*xgap;
            gndVerts[j+1] = -xymax;
            gndVerts[j+2] = 0.0;
            gndVerts[j+3] = 1.0;
        }
        else {
            gndVerts[j  ] = -xymax + (v-1)*xgap;
            gndVerts[j+1] = xymax;
            gndVerts[j+2] = 0.0;
            gndVerts[j+3] = 1.0;
        }
        gndVerts[j+4] = xColr[0];
        gndVerts[j+5] = xColr[1];
        gndVerts[j+6] = xColr[2];
    }

    for(v=0; v<2*ycount; v++, j+= 7) {
        if(v%2==0) {
            gndVerts[j  ] = -xymax;
            gndVerts[j+1] = -xymax + (v)*ygap;
            gndVerts[j+2] = 0.0;
            gndVerts[j+3] = 1.0;
        }
        else {
            gndVerts[j  ] = xymax;
            gndVerts[j+1] = -xymax + (v-1)*ygap;
            gndVerts[j+2] = 0.0;
            gndVerts[j+3] = 1.0;
        }
        gndVerts[j+4] = yColr[0];
        gndVerts[j+5] = yColr[1];
        gndVerts[j+6] = yColr[2];
    }
}

function makeSphere() {
    var slices =12;		
    var sliceVerts	= 21;

    var topColr = new Float32Array([0.0, 0.5, 0.0]);
    var botColr = new Float32Array([0.0, 0.7, 0.0]);
    var errColr = new Float32Array([0.0, 0.5, 0.0]);
    var sliceAngle = Math.PI/slices;	

    sphVerts = new Float32Array(((slices*2*sliceVerts)-2) * floatsPerVertex);
                                
    var cosBot = 0.0;				
    var sinBot = 0.0;				
    var cosTop = 0.0;			
    var sinTop = 0.0;
    var j = 0;					
    var isFirstSlice = 1;		
    var isLastSlice = 0;		
    for(s=0; s<slices; s++) {	
        if(s==0) {
            isFirstSlice = 1;		
            cosBot =  0.0; 		
            sinBot = -1.0;		
        }
        else {					
            isFirstSlice = 0;	
            cosBot = cosTop;
            sinBot = sinTop;
        }						
        cosTop = Math.cos((-Math.PI/2) +(s+1)*sliceAngle); 
        sinTop = Math.sin((-Math.PI/2) +(s+1)*sliceAngle);
        if(s==slices-1) isLastSlice=1;
        for(v=isFirstSlice;    v< 2*sliceVerts-isLastSlice;   v++,j+=floatsPerVertex)
        {					
            if(v%2 ==0) { 
                sphVerts[j  ] = cosBot * Math.cos(Math.PI * v/sliceVerts);	
                sphVerts[j+1] = cosBot * Math.sin(Math.PI * v/sliceVerts);	
                sphVerts[j+2] = sinBot;																			// z
                sphVerts[j+3] = 1.0;
                sphVerts[j+7] = cosBot * Math.cos(Math.PI * v/sliceVerts);	
                sphVerts[j+8] = cosBot * Math.sin(Math.PI * v/sliceVerts);	
                sphVerts[j+9] = sinBot;																			// z
            }
            else {	
                sphVerts[j  ] = cosTop * Math.cos(Math.PI * (v-1)/sliceVerts); 
                sphVerts[j+1] = cosTop * Math.sin(Math.PI * (v-1)/sliceVerts);
                sphVerts[j+2] = sinTop;		
                sphVerts[j+3] = 1.0;	
                sphVerts[j+7] = cosTop * Math.cos(Math.PI * (v-1)/sliceVerts); 
                sphVerts[j+8] = cosTop * Math.sin(Math.PI * (v-1)/sliceVerts);
                sphVerts[j+9] = sinTop;	
            }
            if(v==0) { 	
                sphVerts[j+4]=errColr[0]; 
                sphVerts[j+5]=errColr[1]; 
                sphVerts[j+6]=errColr[2];				
            }
            else if(isFirstSlice==1) {	
                sphVerts[j+4]=botColr[0]; 
                sphVerts[j+5]=botColr[1]; 
                sphVerts[j+6]=botColr[2];	
            }
            else if(isLastSlice==1) {
                sphVerts[j+4]=topColr[0]; 
                sphVerts[j+5]=topColr[1]; 
                sphVerts[j+6]=topColr[2];	
            }
            else {	
                sphVerts[j+4]= 0.0; 
                sphVerts[j+5]= 0.5;	
                sphVerts[j+6]= 0.0;	
            }
        }
    }
}   

function makeSphere1() {
    var slices =12;		
    var sliceVerts	= 21;

    var topColr = new Float32Array([1.0, 0.0, 1.0]);
    var botColr = new Float32Array([1.0, 0.0, 1.0]);
    var errColr = new Float32Array([1.0, 0.0, 1.0]);
    var sliceAngle = Math.PI/slices;	

    sphVerts1 = new Float32Array(((slices*2*sliceVerts)-2) * floatsPerVertex);
                                
    var cosBot = 0.0;				
    var sinBot = 0.0;				
    var cosTop = 0.0;			
    var sinTop = 0.0;
    var j = 0;					
    var isFirstSlice = 1;		
    var isLastSlice = 0;		
    for(s=0; s<slices; s++) {	
        if(s==0) {
            isFirstSlice = 1;		
            cosBot =  0.0; 		
            sinBot = -1.0;		
        }
        else {					
            isFirstSlice = 0;	
            cosBot = cosTop;
            sinBot = sinTop;
        }						
        cosTop = Math.cos((-Math.PI/2) +(s+1)*sliceAngle); 
        sinTop = Math.sin((-Math.PI/2) +(s+1)*sliceAngle);
        if(s==slices-1) isLastSlice=1;
        for(v=isFirstSlice;    v< 2*sliceVerts-isLastSlice;   v++,j+=floatsPerVertex)
        {					
            if(v%2 ==0) { 
                sphVerts1[j  ] = cosBot * Math.cos(Math.PI * v/sliceVerts);	
                sphVerts1[j+1] = cosBot * Math.sin(Math.PI * v/sliceVerts);	
                sphVerts1[j+2] = sinBot;																			// z
                sphVerts1[j+3] = 1.0;	
                sphVerts1[j+7] = cosBot * Math.cos(Math.PI * v/sliceVerts);	
                sphVerts1[j+8] = cosBot * Math.sin(Math.PI * v/sliceVerts);	
                sphVerts1[j+9] = sinBot;																			// w.				
            }
            else {	
                sphVerts1[j  ] = cosTop * Math.cos(Math.PI * (v-1)/sliceVerts); 
                sphVerts1[j+1] = cosTop * Math.sin(Math.PI * (v-1)/sliceVerts);
                sphVerts1[j+2] = sinTop;		
                sphVerts1[j+3] = 1.0;	
                sphVerts1[j+7] = cosTop * Math.cos(Math.PI * (v-1)/sliceVerts); 
                sphVerts1[j+8] = cosTop * Math.sin(Math.PI * (v-1)/sliceVerts);
                sphVerts1[j+9] = sinTop;
            }
            if(v==0) { 	
                sphVerts1[j+4]=errColr[0]; 
                sphVerts1[j+5]=errColr[1]; 
                sphVerts1[j+6]=errColr[2];				
                }
            else if(isFirstSlice==1) {	
                sphVerts1[j+4]=botColr[0]; 
                sphVerts1[j+5]=botColr[1]; 
                sphVerts1[j+6]=botColr[2];	
                }
            else if(isLastSlice==1) {
                sphVerts1[j+4]=topColr[0]; 
                sphVerts1[j+5]=topColr[1]; 
                sphVerts1[j+6]=topColr[2];	
            }
            else {	
                sphVerts1[j+4]= 1.0; 
                sphVerts1[j+5]= 0.0;	
                sphVerts1[j+6]= 1.0;	
            }
        }
    }
}  

function makeCube(){
    var faceVerts = 4;
    cubeVerts = new Float32Array((2*faceVerts+1)*6*floatsPerVertex);

    upColor = new Float32Array([0.1, 0.3, 0.1]);

    unitLen = Math.sqrt(2);
    // up face
    for (v = 0,j = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
        if (v%2 == 0){  
            cubeVerts[j] = Math.cos(Math.PI*v/4 + Math.PI/4);
            cubeVerts[j+1] = unitLen/2;
            cubeVerts[j+2] = -Math.sin(Math.PI*v/4 + Math.PI/4);
            cubeVerts[j+3] = 1.0;
            cubeVerts[j+4] = upColor[0];
            cubeVerts[j+5] = upColor[1];
            cubeVerts[j+6] = upColor[2];
            cubeVerts[j+7] = 0.0;
            cubeVerts[j+8] = 1.0;
            cubeVerts[j+9] = 0.0;
        } else {  // central vertices
            cubeVerts[j] = 0.0;
            cubeVerts[j+1] = unitLen/2;
            cubeVerts[j+2] = 0.0;
            cubeVerts[j+3] = 1.0; 
            cubeVerts[j+4] = upColor[0];
            cubeVerts[j+5] = upColor[1];
            cubeVerts[j+6] = upColor[2];
            cubeVerts[j+7] = 0.0;
            cubeVerts[j+8] = 1.0;
            cubeVerts[j+9] = 0.0;
        }
    }

    // bottom face
    for (v = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
        if (v%2 == 0){  
            cubeVerts[j] = Math.cos(Math.PI*v/faceVerts + Math.PI/4);
            cubeVerts[j+1] = -unitLen/2;
            cubeVerts[j+2] = -Math.sin(Math.PI*v/faceVerts + Math.PI/4);
            cubeVerts[j+3] = 1.0;
            cubeVerts[j+4] = 0.0;
            cubeVerts[j+5] = 0.2;
            cubeVerts[j+6] = 0.0;
            cubeVerts[j+7] = 0.0;
            cubeVerts[j+8] = -1.0;
            cubeVerts[j+9] = 0.0;
        } else {  // central vertices
            cubeVerts[j] = 0.0;
            cubeVerts[j+1] = -unitLen/2;
            cubeVerts[j+2] = 0.0;
            cubeVerts[j+3] = 1.0; 
            cubeVerts[j+4] = 0.0;
            cubeVerts[j+5] = 0.2;
            cubeVerts[j+6] = 0.0;
            cubeVerts[j+7] = 0.0;
            cubeVerts[j+8] = -1.0;
            cubeVerts[j+9] = 0.0;
        }
    }

    // back
    for (v = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
        if (v%2 == 0){  
            cubeVerts[j] = Math.cos(Math.PI*v/faceVerts + Math.PI/4);
            cubeVerts[j+1] = Math.sin(Math.PI*v/faceVerts + Math.PI/4);
            cubeVerts[j+2] = unitLen/2;
            cubeVerts[j+3] = 1.0;
            cubeVerts[j+4] = 0.6;
            cubeVerts[j+5] = 0.0;
            cubeVerts[j+6] = 0.6;
            cubeVerts[j+7] = 0.0;
            cubeVerts[j+8] = 0.0;
            cubeVerts[j+9] = 1.0;
        } else {  // central vertices
            cubeVerts[j] = 0.0;
            cubeVerts[j+1] = 0.0;
            cubeVerts[j+2] = unitLen/2;
            cubeVerts[j+3] = 1.0; 
            cubeVerts[j+4] = 0.6;
            cubeVerts[j+5] = 0.0;
            cubeVerts[j+6] = 0.6;
            cubeVerts[j+7] = 0.0;
            cubeVerts[j+8] = 0.0;
            cubeVerts[j+9] = 1.0;
        }
    }
    // front
    for (v = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
        if (v%2 == 0){  
            cubeVerts[j] = Math.cos(Math.PI*v/faceVerts + Math.PI/4);
            cubeVerts[j+1] = Math.sin(Math.PI*v/faceVerts + Math.PI/4);
            cubeVerts[j+2] = -unitLen/2;
            cubeVerts[j+3] = 1.0;
            cubeVerts[j+4] = 0.8;
            cubeVerts[j+5] = 0.0;
            cubeVerts[j+6] = 0.8;
            cubeVerts[j+7] = 0.0;
            cubeVerts[j+8] = 0.0;
            cubeVerts[j+9] = -1.0;
        } else {  // central vertices
            cubeVerts[j] = 0.0;
            cubeVerts[j+1] = 0.0;
            cubeVerts[j+2] = -unitLen/2;
            cubeVerts[j+3] = 1.0; 
            cubeVerts[j+4] = 0.8;
            cubeVerts[j+5] = 0.0;
            cubeVerts[j+6] = 0.8;
            cubeVerts[j+7] = 0.0;
            cubeVerts[j+8] = 0.0;
            cubeVerts[j+9] = -1.0;
        }
    }

    // right
    for (v = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
        if (v%2 == 0){  
            cubeVerts[j] = unitLen/2;
            cubeVerts[j+1] = Math.sin(Math.PI*v/faceVerts + Math.PI/4);
            cubeVerts[j+2] = -Math.cos(Math.PI*v/faceVerts + Math.PI/4);
            cubeVerts[j+3] = 1.0;
            cubeVerts[j+4] = 0.0;
            cubeVerts[j+5] = 0.0;
            cubeVerts[j+6] = 1.0;
            cubeVerts[j+7] = 1.0;
            cubeVerts[j+8] = 0.0;
            cubeVerts[j+9] = 0.0;
        } else {  // central vertices
            cubeVerts[j] = unitLen/2;
            cubeVerts[j+1] = 0.0;
            cubeVerts[j+2] = 0.0;
            cubeVerts[j+3] = 1.0; 
            cubeVerts[j+4] = 0.0;
            cubeVerts[j+5] = 0.0;
            cubeVerts[j+6] = 1.0;
            cubeVerts[j+7] = 1.0;
            cubeVerts[j+8] = 0.0;
            cubeVerts[j+9] = 0.0;
        }
    }
    // left
    for (v = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
        if (v%2 == 0){  
            cubeVerts[j] = -unitLen/2;
            cubeVerts[j+1] = Math.sin(Math.PI*v/faceVerts + Math.PI/4);
            cubeVerts[j+2] = -Math.cos(Math.PI*v/faceVerts + Math.PI/4);
            cubeVerts[j+3] = 1.0;
            cubeVerts[j+4] = 0.0;
            cubeVerts[j+5] = 0.0;
            cubeVerts[j+6] = 0.5;
            cubeVerts[j+7] = -1.0;
            cubeVerts[j+8] = 0.0;
            cubeVerts[j+9] = 0.0;
        } else {  // central vertices
            cubeVerts[j] = -unitLen/2;
            cubeVerts[j+1] = 0.0;
            cubeVerts[j+2] = 0.0;
            cubeVerts[j+3] = 1.0; 
            cubeVerts[j+4] = 0.0;
            cubeVerts[j+5] = 0.0;
            cubeVerts[j+6] = 0.5;
            cubeVerts[j+7] = -1.0;
            cubeVerts[j+8] = 0.0;
            cubeVerts[j+9] = 0.0;
        }
    }
}
    
function makeCylinder() {    
    var topColr = new Float32Array([0.8, 0.8, 0.0]);	// light yellow top,
    var walColr = new Float32Array([0.0, 0.5, 0.5]);	// dark green walls,
    var botColr = new Float32Array([0.2, 0.6, 0.2]);	// light blue bottom,
    var ctrColr = new Float32Array([0.1, 0.1, 0.1]); // near black end-cap centers,
    var errColr = new Float32Array([0.2, 0.6, 0.2]);	// Bright-red trouble color.

    var capVerts = 20;	
    var topRadius = 0.9;
    
    cylVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
    for(v=0,j=0;   v<(2*capVerts)-1;   v++,j+=floatsPerVertex) {	
        if(v%2 ==0)
        {			
            cylVerts[j  ] = Math.cos(Math.PI*v/capVerts);			// x
            cylVerts[j+1] = Math.sin(Math.PI*v/capVerts);			// y
            cylVerts[j+2] =-1.0;	// z
            cylVerts[j+3] = 1.0;	// w.
            // r,g,b = botColr[] 
            cylVerts[j+4]=botColr[0]; 
            cylVerts[j+5]=botColr[1]; 
            cylVerts[j+6]=botColr[2];
        }
        else {	// put odd# vertices at center of cylinder's bottom cap:
            cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1; centered on z axis at -1.
            cylVerts[j+1] = 0.0;	
            cylVerts[j+2] =-1.0; 
            cylVerts[j+3] = 1.0;			// r,g,b = ctrColr[]
            cylVerts[j+4]=ctrColr[0]; 
            cylVerts[j+5]=ctrColr[1]; 
            cylVerts[j+6]=ctrColr[2];
        }
        cylVerts[j+7] = 0.0;
        cylVerts[j+8] = 0.0;
        cylVerts[j+9] = -1.0;
    }
    // Create the cylinder side walls
    for(v=0; v< 2*capVerts;   v++, j+=floatsPerVertex) {
        if(v%2==0) {		
            cylVerts[j  ] = Math.cos(Math.PI*(v)/capVerts);		// x
            cylVerts[j+1] = Math.sin(Math.PI*(v)/capVerts);		// y
            cylVerts[j+2] =-1.0;	// ==z  BOTTOM cap,
            cylVerts[j+3] = 1.0;	// w.
            cylVerts[j+4]=walColr[0]; 
            cylVerts[j+5]=walColr[1]; 
            cylVerts[j+6]=walColr[2];			
            if(v==0) {
                cylVerts[j+4] = errColr[0]; 
                cylVerts[j+5] = errColr[1];
                cylVerts[j+6] = errColr[2];
            }
            cylVerts[j+7] = Math.cos(Math.PI*(v)/capVerts);
            cylVerts[j+8] = Math.sin(Math.PI*(v)/capVerts);
            cylVerts[j+9] = 0.0;
        }
        else {
            cylVerts[j  ] = topRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
            cylVerts[j+1] = topRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
            cylVerts[j+2] = 1.0;	// == z TOP cap,
            cylVerts[j+3] = 1.0;	// w.
            // r,g,b = walColr;
            cylVerts[j+4]=walColr[0]; 
            cylVerts[j+5]=walColr[1]; 
            cylVerts[j+6]=walColr[2];
            cylVerts[j+7] = topRadius * Math.cos(Math.PI*(v-1)/capVerts);
            cylVerts[j+8] = topRadius * Math.sin(Math.PI*(v-1)/capVerts);
            cylVerts[j+9] = 0.0;
        }
    }
    // Complete the cylinder with its top cap
    for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
        // count vertices from zero again, and
        if(v%2==0) {	// position even #'d vertices around top cap's outer edge.
            cylVerts[j  ] = topRadius * Math.cos(Math.PI*(v)/capVerts);		// x
            cylVerts[j+1] = topRadius * Math.sin(Math.PI*(v)/capVerts);		// y
            cylVerts[j+2] = 1.0;	// z
            cylVerts[j+3] = 1.0;	// w.
            cylVerts[j+4]=topColr[0]; 
            cylVerts[j+5]=topColr[1]; 
            cylVerts[j+6]=topColr[2];
            if(v==0) {
                cylVerts[j+4] = errColr[0]; 
                cylVerts[j+5] = errColr[1];
                cylVerts[j+6] = errColr[2];	
            }
        }
        else {				// position odd#'d vertices at center of the top cap:
            cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
            cylVerts[j+1] = 0.0;	
            cylVerts[j+2] = 1.0; 
            cylVerts[j+3] = 1.0;			
            cylVerts[j+4]=ctrColr[0]; 
            cylVerts[j+5]=ctrColr[1]; 
            cylVerts[j+6]=ctrColr[2];  
        }
        cylVerts[j+7] = 0.0; 
        cylVerts[j+8] = 0.0;
        cylVerts[j+9] = 1.0;
    }
}

function makeTorus() {
    var rTube = 0.07;
    var rBend = 0.7;
    var tubeRings = 23;
    var ringSides = 13;
    torVerts = new Float32Array(floatsPerVertex*(2*ringSides*tubeRings +2));
    var phi=0, theta=0;
    var thetaStep = 2*Math.PI/tubeRings;
    var phiHalfStep = Math.PI/ringSides;
                                                                                // (WHY HALF? 2 vertices per step in phi)
    for(s=0,j=0; s<tubeRings; s++) 
    {
        for(v=0; v< 2*ringSides; v++, j+=floatsPerVertex) 
            {
            if(v%2==0)	{
                torVerts[j  ] = (rBend + rTube*Math.cos((v)*phiHalfStep)) * 
                                                Math.cos((s)*thetaStep);
                torVerts[j+1] = (rBend + rTube*Math.cos((v)*phiHalfStep)) *
                                                Math.sin((s)*thetaStep);
                torVerts[j+2] = -rTube*Math.sin((v)*phiHalfStep);
                torVerts[j+3] = 1.0;		// w
            }
            else {				// odd #'d vertices at top of slice (s+1);
                                        // at same phi used at bottom of slice (v-1)
                torVerts[j  ] = (rBend + rTube*Math.cos((v-1)*phiHalfStep)) * 
                                        Math.cos((s+1)*thetaStep);
                                //	x = (rBend + rTube*cos(phi)) * cos(NextTheta)
                torVerts[j+1] = (rBend + rTube*Math.cos((v-1)*phiHalfStep)) *
                                                Math.sin((s+1)*thetaStep);
                                //  y = (rBend + rTube*cos(phi)) * sin(NextTheta) 
                torVerts[j+2] = -rTube*Math.sin((v-1)*phiHalfStep);
                                //  z = -rTube  *   sin(phi)
                torVerts[j+3] = 1.0;		// w
            }
            if(v==0 && s!=0) {		// 'troublesome' vertex shared by step & 2 rings
                torVerts[j+4] = 1.0;		//  BRIGHT RED to show its location.
                torVerts[j+5] = 0.2;		
                torVerts[j+6] = 0.2;		
            }
            else {
                torVerts[j+4] = Math.random()/2;		// random color 0.0 <= R < 0.5
                torVerts[j+5] = Math.random()/2;		// random color 0.0 <= G < 0.5
                torVerts[j+6] = Math.random()/2;		// random color 0.0 <= B < 0.5
                }
        }
    }
            torVerts[j  ] = rBend + rTube;	// copy vertex zero;
                            //	x = (rBend + rTube*cos(phi==0)) * cos(theta==0)
            torVerts[j+1] = 0.0;
                            //  y = (rBend + rTube*cos(phi==0)) * sin(theta==0) 
            torVerts[j+2] = 0.0;
                            //  z = -rTube  *   sin(phi==0)
            torVerts[j+3] = 1.0;		// w
            torVerts[j+4] = Math.random()/2;		// random color 0.0 <= R < 0.5
            torVerts[j+5] = Math.random()/2;		// random color 0.0 <= G < 0.5
            torVerts[j+6] = Math.random()/2;		// random color 0.0 <= B < 0.5
            j+=7; // go to next vertex:
            torVerts[j  ] = (rBend + rTube) * Math.cos(thetaStep);
                            //	x = (rBend + rBar*cos(phi==0)) * cos(theta==thetaStep)
            torVerts[j+1] = (rBend + rTube) * Math.sin(thetaStep);
                            //  y = (rBend + rTube*cos(phi==0)) * sin(theta==thetaStep) 
            torVerts[j+2] = 0.0;
                            //  z = -rTube  *   sin(phi==0)
            torVerts[j+3] = 1.0;		// w
            torVerts[j+4] = Math.random()/2;		// random color 0.0 <= R < 0.5
            torVerts[j+5] = Math.random()/2;		// random color 0.0 <= G < 0.5
            torVerts[j+6] = Math.random()/2;		// random color 0.0 <= B < 0.5
}

function makePyramid() {
    botVert = 4;  // number of vertices on the bottom
    pyrVerts = new Float32Array((4*botVert+3)*floatsPerVertex);

    // bottom
    for (v = 0, j = 0; v < 2*botVert+2; v++, j += floatsPerVertex){
        if (v%2 == 0){
            pyrVerts[j] = Math.cos(Math.PI*v/botVert);
            pyrVerts[j+1] = Math.sin(Math.PI*v/botVert);
            pyrVerts[j+2] = 0.0;
            pyrVerts[j+3] = 1.0;
            pyrVerts[j+4] = 0.3;
            pyrVerts[j+5] = 0.3;
            pyrVerts[j+6] = 0.3;
        }else{
            pyrVerts[j] = 0.0;
            pyrVerts[j+1] = 0.0;
            pyrVerts[j+2] = 0.0;
            pyrVerts[j+3] = 1.0;
            pyrVerts[j+4] = 0.3;
            pyrVerts[j+5] = 0.3;
            pyrVerts[j+6] = 0.3;           
        }
        pyrVerts[j+7] = 0.0;
        pyrVerts[j+8] = 0.0;
        pyrVerts[j+9] = 1.0;
    }

    // wall
    for (v = 0; v < 2*botVert+1; v++, j+=floatsPerVertex){
        if (v%2 == 0){
            pyrVerts[j] = Math.cos(Math.PI*v/botVert);
            pyrVerts[j+1] = Math.sin(Math.PI*v/botVert);
            pyrVerts[j+2] = 0.0;
            pyrVerts[j+3] = 1.0;
            pyrVerts[j+4] = 0.3;
            pyrVerts[j+5] = 0.5;
            pyrVerts[j+6] = 0.3;
            pyrVerts[j+7] = Math.cos(Math.PI*v/botVert);
            pyrVerts[j+8] = Math.sin(Math.PI*v/botVert);
            pyrVerts[j+9] = 1.0;
        } else{
            pyrVerts[j] = 0.0;
            pyrVerts[j+1] = 0.0;
            pyrVerts[j+2] = 1.0;
            pyrVerts[j+3] = 1.0;
            pyrVerts[j+4] = 0.3;
            pyrVerts[j+5] = 0.7;
            pyrVerts[j+6] = 0.3;
            pyrVerts[j+7] = Math.cos(Math.PI*(v-1)/botVert);
            pyrVerts[j+8] = Math.sin(Math.PI*(v-1)/botVert);
            pyrVerts[j+9] = 1.0;
        }
    }
}

function makeCone() {
    botVert = 20;  // number of vertices on the bottom
    coneVert = new Float32Array((4*botVert+3)*floatsPerVertex);

    for (v = 0, j = 0; v < 2*botVert+2; v++, j += floatsPerVertex){
        if (v%2 == 0){
            coneVert[j] = Math.cos(Math.PI*v/botVert);
            coneVert[j+1] = Math.sin(Math.PI*v/botVert);
            coneVert[j+2] = 0.0;
            coneVert[j+3] = 1.0;
            coneVert[j+4] = 0.3;
            coneVert[j+5] = 0.3;
            coneVert[j+6] = 0.3;
        }else{
            coneVert[j] = 0.0;
            coneVert[j+1] = 0.0;
            coneVert[j+2] = 0.0;
            coneVert[j+3] = 1.0;
            coneVert[j+4] = 0.3;
            coneVert[j+5] = 0.3;
            coneVert[j+6] = 0.3;           
        }
    }

    // wall
    for (v = 0; v < 2*botVert+1; v++, j+=floatsPerVertex){
        if (v%2 == 0){
            coneVert[j] = Math.cos(Math.PI*v/botVert);
            coneVert[j+1] = Math.sin(Math.PI*v/botVert);
            coneVert[j+2] = 0.0;
            coneVert[j+3] = 1.0;
            coneVert[j+4] = 1.0;
            coneVert[j+5] = 0.0;
            coneVert[j+6] = 1.0;
        } else{
            coneVert[j] = 0.0;
            coneVert[j+1] = 0.0;
            coneVert[j+2] = 1.0;
            coneVert[j+3] = 1.0;
            coneVert[j+4] = Math.random()/2;;
            coneVert[j+5] = 0.0;
            coneVert[j+6] = 1.0;
        }
    }
}

function makeAxis(){
    axisVerts = new Float32Array([
        0.0,  0.0,  0.0, 1.0,		0.3,  0.3,  0.3,	// X axis line (origin: gray)
        3.3,  0.0,  0.0, 1.0,		1.0,  0.3,  0.3,	// 						 (endpoint: red)
		 
        0.0,  0.0,  0.0, 1.0,       0.3,  0.3,  0.3,	// Y axis line (origin: white)
        0.0,  3.3,  0.0, 1.0,		0.3,  1.0,  0.3,	//						 (endpoint: green)

        0.0,  0.0,  0.0, 1.0,		0.3,  0.3,  0.3,	// Z axis line (origin:white)
        0.0,  0.0,  3.3, 1.0,		0.3,  0.3,  1.0,	//						 (endpoint: blue)
    ]);
}

/*************Draw parts here***************/
function drawRobot(modelMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix){
    /*******************Robot group******************************/
    modelMatrix.rotate(90, 1.0,0.0,0.0);
    modelMatrix.translate(0.0, 0.7, 0.0);
    
    if (walkStart || stepStart){
        walkAround(modelMatrix);
    }
    if (rRobot){
        modelMatrix.rotate(currentAngle, 0, 1, 0);
        // modelMatrix.rotate(currentAngle/5, 1, 0, 0);	// spin more slowly on x.
    }
    // quatMatrix.setFromQuat(qTot.x, qTot.y, qTot.z, qTot.w);	// Quaternion Drag
	// modelMatrix.concat(quatMatrix);
    pushMatrix(modelMatrix);
    

    /*******************Upper body group******************************/ 
    if (bowStart){
        bow(modelMatrix, (currentAngle-50)/2);
    }
    pushMatrix(modelMatrix); 

    // Draw body(cube)
    drawBody(modelMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix);
    /**************Draw arms group(cube+torus/pyramaid)*****************/
    modelMatrix = popMatrix();    
    pushMatrix(modelMatrix);
    drawArms(modelMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix);
    // Draw head(sphere)
    modelMatrix = popMatrix();    
    drawHead(modelMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix);

    /*******************Draw lower body(cyclinder+cube) group***********/
    modelMatrix = popMatrix();
    drawLowerBody(modelMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix);
}

function drawBody(modelMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix){
    modelMatrix.scale(0.25, 0.3, 0.2);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
}

function drawHead(modelMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix){
    // Draw head(sphere):
    modelMatrix.translate(0.0, unitLen*0.25, 0.0);
    modelMatrix.scale(0.15,0.15,0.15);
    if (rHead){
        modelMatrix.rotate(currentAngle, 0, 1, 0);
    }
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphStart/floatsPerVertex, sphVerts.length/floatsPerVertex);
}

function drawArms(modelMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix){
    modelMatrix.scale(0.25, 0.3, 0.2);
    /***********Draw arms group**************/
    pushMatrix(modelMatrix);  // push arm
    // draw left arm
    modelMatrix.translate(-unitLen*0.55, unitLen*0.4, 0);
    if (rLArm){
        modelMatrix.rotate(currentAngle*0.8, 1,0,0);
    }
    modelMatrix.rotate(-30, 0,0,1);
    pushMatrix(modelMatrix);  // push left
    // draw upper arm
    modelMatrix.scale(0.2, 0.5, 0.25);
    modelMatrix.translate(0,-unitLen*0.6,0);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
    modelMatrix = popMatrix();  // pop left
    // draw lower group
    modelMatrix.translate(0.05,-unitLen*0.5,0);  
    if (rLArm){
        modelMatrix.rotate(currentAngle,1,0,0);    
    }
    modelMatrix.translate(0,-0.3,0);
    modelMatrix.rotate(10, 0,0,1);
    pushMatrix(modelMatrix);  // push lower
    // draw lower arm
    modelMatrix.scale(0.2*0.9, 0.5*0.9, 0.25*0.9);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
    modelMatrix = popMatrix();  // pop lower
    // draw pincers
    pushMatrix(modelMatrix);  // push lower
    // modelMatrix.rotate(10, 0,0,1);
    modelMatrix.translate(0, -unitLen*0.3, 0);
    modelMatrix.scale(0.05,0.2,0.05);
    // draw left jaw
    modelMatrix.translate(unitLen*1.3, 0, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
    // draw right jaw
    modelMatrix.translate(-unitLen*2.6, 0, 0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
    
    modelMatrix = popMatrix();  // pop lower
    // draw object
    // var hold = mypick.options[index].value;
    if (hold == 'Torus'){
        drawTorus(modelMatrix, u_ModelMatrix);
    }else if(hold == 'Umbrella'){
        drawUmbrella(modelMatrix, u_ModelMatrix);
    }else if(hold == 'diamond'){
        drawDiamondWand(modelMatrix, u_ModelMatrix);
    }

    // draw right arm
    modelMatrix = popMatrix();  // pop arm
    modelMatrix.translate(unitLen*0.55, unitLen*0.4, 0);
    if (rRArm){
        modelMatrix.rotate(-currentAngle*0.8, 1,0,0);
    }
    modelMatrix.rotate(30, 0,0,1);
    pushMatrix(modelMatrix);  // push left
    // draw upper arm
    modelMatrix.scale(0.2, 0.5, 0.25);
    modelMatrix.translate(0,-unitLen*0.6,0);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
    modelMatrix = popMatrix();  // pop left
    // draw lower group
    modelMatrix.translate(-0.05,-unitLen*0.5,0);    
    if(rRArm){
        modelMatrix.rotate(-currentAngle,1,0,0);
    }
    modelMatrix.translate(0,-0.3,0);
    modelMatrix.rotate(-10, 0,0,1);
    pushMatrix(modelMatrix);  // push lower
    // draw lower arm
    modelMatrix.scale(0.2*0.9, 0.5*0.9, 0.25*0.9);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
    modelMatrix = popMatrix();  // pop lower
    // draw pincers
    modelMatrix.translate(0, -unitLen*0.3, 0);
    modelMatrix.scale(0.05,0.2,0.05);
    // draw left jaw
    modelMatrix.translate(unitLen*1.3, 0, 0);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
    // draw right jaw
    modelMatrix.translate(-unitLen*2.6, 0, 0);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
}

function drawLowerBody(modelMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix){
    // Do lower body transformations...
    // modelMatrix.rotate(currentAngle, 0,1,0);
    pushMatrix(modelMatrix);
    // Draw left leg
    modelMatrix.translate(-unitLen*0.07, -unitLen*0.11, 0.0);
    if (rLower){
        modelMatrix.rotate(-currentAngle*0.8, 1,0,0);
    }
    modelMatrix.rotate(90, 1,0,0);
    modelMatrix.rotate(180, 0,0,1);
    modelMatrix.scale(0.05,0.05,0.2);
    modelMatrix.translate(0, 0, unitLen*0.89);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

    // left foot
    // inverse
    modelMatrix.translate(0,0,-unitLen*0.89);
    modelMatrix.scale(1/0.05, 1/0.05, 1/0.2);
    modelMatrix.rotate(-180, 0,0,1);
    modelMatrix.rotate(-90, 1,0,0);
    // trans
    modelMatrix.translate(0, -unitLen*0.34, 0);
    modelMatrix.scale(0.06, 0.05, 0.1);
    modelMatrix.translate(0.0, 0.0, -0.3);
    modelMatrix.rotate(45, 0,1,0);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);

    //Draw right leg
    modelMatrix = popMatrix();
    modelMatrix.translate(unitLen*0.07, -unitLen*0.11, 0.0);
    if (rLower){
        modelMatrix.rotate(currentAngle*0.8, 1,0,0);
    }
    modelMatrix.rotate(90, 1,0,0);
    modelMatrix.scale(0.05,0.05,0.2);
    modelMatrix.translate(0, 0, unitLen*0.89);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);

    // right foot
    // inverse
    modelMatrix.translate(0,0,-unitLen*0.89);
    modelMatrix.scale(1/0.05, 1/0.05, 1/0.2);
    modelMatrix.rotate(-90, 1,0,0);
    // trans
    modelMatrix.translate(0, -unitLen*0.34, 0);
    modelMatrix.scale(0.06, 0.05, 0.1);
    modelMatrix.translate(0.0, 0.0, -0.3);
    modelMatrix.rotate(45, 0,1,0);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
}

function drawTorus(modelMatrix, u_ModelMatrix){
    modelMatrix.translate(0, -unitLen*0.8, 0);
    modelMatrix.rotate(60, 0,1,0);
    modelMatrix.rotate(currentAngle, 0,0,1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, torStart/floatsPerVertex, torVerts.length/floatsPerVertex);
}

function drawUmbrella(modelMatrix, u_ModelMatrix){
    // cube
    pushMatrix(modelMatrix)
    modelMatrix.translate(0, -unitLen*0.8, 0.0);
    modelMatrix.scale(0.05, 1.0, 0.05);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
    
    modelMatrix = popMatrix(modelMatrix);
    modelMatrix.translate(-0.7, -unitLen*0.6, 0);
    modelMatrix.rotate(90, 1,0,0);
    modelMatrix.translate(0.7, 0, 0);
    modelMatrix.scale(0.2,0.2,1.5);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, coneStart/floatsPerVertex, coneVert.length/floatsPerVertex);
}

function drawGroundGrid(modelMatrix, u_ModelMatrix){  
    modelMatrix.translate( 0.4, -0.4, 0.0);	
    modelMatrix.scale(0.1, 0.1, 0.1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.LINES, gndStart/floatsPerVertex, gndVerts.length/floatsPerVertex);
}

function drawHelicopter(modelMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix){
    modelMatrix.rotate(90, 1.0,0.0,0.0);
    modelMatrix.translate(0.0, 1.6, 0);
    if (flyStart){
        flyAround(modelMatrix);
    }
    modelMatrix.scale(0.5,0.5,0.5);
    if (shapeChange){
        modelMatrix.scale(currentAngle/50+1, currentAngle/50+1, currentAngle/50+1);
    }

    // Heli group
    pushMatrix(modelMatrix);  // rear propellers
    pushMatrix(modelMatrix); // rear wings
    pushMatrix(modelMatrix); // up propellers
    pushMatrix(modelMatrix); // up cube
    modelMatrix.scale(0.33,0.2,0.15);
    modelMatrix.rotate(90, 1,0,0);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphStart/floatsPerVertex, sphVerts.length/floatsPerVertex);

    // draw rear wing
    modelMatrix = popMatrix();
    modelMatrix.translate(0.3, 0.0, 0.0);
    modelMatrix.rotate(90, 0,1,0);
    modelMatrix.scale(0.03,0.03,0.7);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, pyrStart/floatsPerVertex, pyrVerts.length/floatsPerVertex);
    

    // up propeller group
    modelMatrix = popMatrix();
    modelMatrix.translate(0, 0.3, 0.0);
    pushMatrix(modelMatrix);
    pushMatrix(modelMatrix);
    pushMatrix(modelMatrix);
    modelMatrix.rotate(flyAngle*15, 0,1,0);
    modelMatrix.scale(0.4,0.01, 0.03);
    modelMatrix.translate(-0.7,0,0);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);

    modelMatrix = popMatrix();
    modelMatrix.rotate((flyAngle+90)*15, 0,1,0);
    modelMatrix.scale(0.4,0.01, 0.03);
    modelMatrix.translate(-0.7,0,0);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);

    modelMatrix = popMatrix();
    modelMatrix.rotate((flyAngle+180)*15, 0,1,0);
    modelMatrix.scale(0.4,0.01, 0.03);
    modelMatrix.translate(-0.7,0,0);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);

    modelMatrix = popMatrix();
    modelMatrix.rotate((flyAngle+270)*15, 0,1,0);
    modelMatrix.scale(0.4,0.01, 0.03);
    modelMatrix.translate(-0.7,0,0);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);

    // up cube
    modelMatrix = popMatrix();
    modelMatrix.translate(0, 0.25, 0.0);
    modelMatrix.rotate(-90, 1,0,0);
    modelMatrix.rotate(flyAngle, 0,0,1);
    modelMatrix.scale(0.02,0.02,0.05);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex);


    // rear propeller group
    modelMatrix = popMatrix();
    modelMatrix.translate(0.99, 0.0, 0.0);
    modelMatrix.rotate(90, 0,0,1);
    pushMatrix(modelMatrix);
    pushMatrix(modelMatrix);
    pushMatrix(modelMatrix);
    modelMatrix.rotate(flyAngle*15, 0,1,0);
    modelMatrix.scale(0.1,0.01, 0.03);
    modelMatrix.translate(-0.7,0,0);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);

    modelMatrix = popMatrix();
    modelMatrix.rotate((flyAngle+90)*15, 0,1,0);
    modelMatrix.scale(0.1,0.01, 0.03);
    modelMatrix.translate(-0.7,0,0);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);

    modelMatrix = popMatrix();
    modelMatrix.rotate((flyAngle+180)*15, 0,1,0);
    modelMatrix.scale(0.1,0.01, 0.03);
    modelMatrix.translate(-0.7,0,0);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
   
    modelMatrix = popMatrix();
    modelMatrix.rotate((flyAngle+270)*15, 0,1,0);
    modelMatrix.scale(0.1,0.01, 0.03);
    modelMatrix.translate(-0.7,0,0);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
}

function drawConeTorus(modelMatrix, u_ModelMatrix){
    pushMatrix(modelMatrix);
    modelMatrix.translate(1.5,1.5,0);
    modelMatrix.scale(0.25,0.25,0.5);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, coneStart/floatsPerVertex, coneVert.length/floatsPerVertex); 
    
    modelMatrix = popMatrix();
    modelMatrix.translate(1.5,1.5,0.5);
    modelMatrix.scale(0.25,0.25,0.25);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, torStart/floatsPerVertex, torVerts.length/floatsPerVertex);
}

function drawConeUmbrl(modelMatrix, u_ModelMatrix){
    pushMatrix(modelMatrix);
    modelMatrix.translate(-1.5,1.5,0);
    modelMatrix.scale(0.25,0.25,0.5);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, coneStart/floatsPerVertex, coneVert.length/floatsPerVertex); 
    modelMatrix = popMatrix();
    modelMatrix.translate(-1.5,1.9,0.5);
    modelMatrix.scale(0.25,0.25,0.25);
    // modelMatrix.rotate(90, 0,0,1);
    drawUmbrella(modelMatrix, u_ModelMatrix);
}

function drawTree(modelMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix){

    modelMatrix.translate(1.5,-1.5,0);
    pushMatrix(modelMatrix);
    modelMatrix.translate(0,0,0.4)
    modelMatrix.scale(0.8,0.8,0.2);
    pushMatrix(modelMatrix);  // new
    modelMatrix.rotate(sphAngle,0,0,1);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, pyrStart/floatsPerVertex, pyrVerts.length/floatsPerVertex);
    
    modelMatrix = popMatrix();  // new
    modelMatrix.translate(0,0,1);
    modelMatrix.scale(0.7,0.7,1);
    pushMatrix(modelMatrix);  // new
    modelMatrix.rotate(-sphAngle*2,0,0,1);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, pyrStart/floatsPerVertex, pyrVerts.length/floatsPerVertex);
    
    modelMatrix = popMatrix();  // new
    modelMatrix.translate(0,0,1);
    modelMatrix.scale(0.7,0.7,1);
    modelMatrix.rotate(sphAngle*4,0,0,1);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, pyrStart/floatsPerVertex, pyrVerts.length/floatsPerVertex);

    modelMatrix = popMatrix();
    modelMatrix.translate(0,0,0.2);
    modelMatrix.scale(0.08,0.08,0.2);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cylStart/floatsPerVertex, cylVerts.length/floatsPerVertex); 
}

function drawLargeSphere(modelMatrix, u_ModelMatrix, u_MvpMatrix, u_NormalMatrix){
    modelMatrix.scale(0.5,0.5,0.5);
    modelMatrix.translate(-3,-8,0);
    modelMatrix.rotate(sphAngle, 0,0,1);
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    mvpMatrix.set(vpMatrix).multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphStart1/floatsPerVertex, sphVerts1.length/floatsPerVertex);
}

/*************Register events here***************/
function myMouseDown(ev) {  
    var rect = ev.target.getBoundingClientRect();
    var xp = ev.clientX - rect.left;
    var yp = canvas.height - (ev.clientY - rect.top);
    // webgl(CVV) coords
    var x = (xp - canvas.width/2) / (canvas.width/2);
    var y = (yp - canvas.height/2) / (canvas.height/2);
    isDrag = true;
    xMclik = x;	
    yMclik = y;
    // Stop helicopter by clicking in a specific area.
    // if (ev.clientX<610 && ev.clientY<230){   // when using x, y, seems x and y may have same values outside canvas.
    //     runStopHeli();
    // }
}

function myMouseMove(ev){
    if(isDrag==false) return;	

    var rect = ev.target.getBoundingClientRect();	
    var xp = ev.clientX - rect.left;							
    var yp = canvas.height - (ev.clientY - rect.top);
    
    var x = (xp - canvas.width/2) / (canvas.width/2);	
    var y = (yp - canvas.height/2) / (canvas.height/2);
 
    xMdragTot += (x - xMclik);
    yMdragTot += (y - yMclik);

    lamp0.I_pos.elements.set([
        lamp0.I_pos.elements[0] - (x - xMclik)*50,
        lamp0.I_pos.elements[1],
        lamp0.I_pos.elements[2] + (y - yMclik)*50]);

    xMclik = x;
    yMclik = y;
}

function myMouseUp(ev) {
    var rect = ev.target.getBoundingClientRect();	
    var xp = ev.clientX - rect.left;							
    var yp = canvas.height - (ev.clientY - rect.top);

    var x = (xp - canvas.width/2) /	(canvas.width/2);		
    var y = (yp - canvas.height/2) / (canvas.height/2);

    isDrag = false;	
    xMdragTot += (x - xMclik);
    yMdragTot += (y - yMclik);

    // dragQuat(x - xMclik, y - yMclik);
}

function myKeyDown(ev){
    switch(ev.code){
        case "KeyP":
          // Toggle rotation
          if(ANGLE_STEP*ANGLE_STEP > 1) {
            myTmp = ANGLE_STEP;
            ANGLE_STEP = 0;
          }
          else {
            ANGLE_STEP = myTmp;
          }
          break;
        
        case "KeyA":
            // walk left
            direction = -90;
            currLocX += Math.abs(walk_ANGLE_STEP)/200;
            stepEvent();
            break;

        case "KeyD":
            // walk right
            direction = 90;
            currLocX -= Math.abs(walk_ANGLE_STEP)/200;
            stepEvent();
            break;

        case "KeyW":
            // walk foward
            direction = 180;
            currLocZ += Math.abs(walk_ANGLE_STEP)/200;
            stepEvent();
            break;

        case "KeyS":
            // walk back
            direction = 0;
            currLocZ -= Math.abs(walk_ANGLE_STEP)/200;
            stepEvent();
            break;

        case "ArrowLeft":
            // camera move left
            eyeX += 0.1*Math.cos(theta*Math.PI/180);
            eyeY += 0.1*Math.sin(theta*Math.PI/180);
            atX += 0.1*Math.cos(theta*Math.PI/180);
            atY += 0.1*Math.sin(theta*Math.PI/180);
            break;

        case "ArrowRight":
            // camera move right
            eyeX -= 0.1*Math.cos(theta*Math.PI/180);
            eyeY -= 0.1*Math.sin(theta*Math.PI/180);
            atX -= 0.1*Math.cos(theta*Math.PI/180);
            atY -= 0.1*Math.sin(theta*Math.PI/180);
            break;

        case "ArrowUp":
            atZ += 0.1;
            eyeZ += 0.1;
            break;
        
        case "ArrowDown":
            atZ -= 0.1;
            eyeZ -= 0.1;
            break;

        case "Equal":
            // camera move foward
            eyeX += 0.1*Math.sin(theta*Math.PI/180);
            atX += 0.1*Math.sin(theta*Math.PI/180); 
            eyeY -= 0.1*Math.cos(theta*Math.PI/180);
            atY -= 0.1*Math.cos(theta*Math.PI/180);
            var tan = (atZ - eyeZ) / (atY - eyeY);
            eyeZ -= 0.1*Math.cos(theta*Math.PI/180) * tan;
            atZ -= 0.1*Math.cos(theta*Math.PI/180) * tan;
            break;
        
        case "Minus":
            // camera move backward
            eyeX -= 0.1*Math.sin(theta*Math.PI/180);
            atX -= 0.1*Math.sin(theta*Math.PI/180); 
            eyeY += 0.1*Math.cos(theta*Math.PI/180);
            atY += 0.1*Math.cos(theta*Math.PI/180);
            var tan = (atZ - eyeZ) / (atY - eyeY);
            eyeZ += 0.1*Math.cos(theta*Math.PI/180) * tan;
            atZ += 0.1*Math.cos(theta*Math.PI/180) * tan;
            break;

        case "KeyI":
            // camera move up
            atZ += 0.1;  // tilt
            break;

        case "KeyK":
            // camera move down
            atZ -= 0.1;  // tilt
            break;

        case "KeyJ":
            // camera look left
            theta += 2;
            atX = eyeX + r*Math.sin(theta*Math.PI/180);
            atY = eyeY - r*Math.cos(theta*Math.PI/180);
            break;

        case "KeyL":
            // camera look right
            theta -= 2;
            atX = eyeX + r*Math.sin(theta*Math.PI/180);
            atY = eyeY - r*Math.cos(theta*Math.PI/180);
            break;

        case "KeyV":
            // change view perspective
            frustum = !frustum;
            break;

        case "Space":
            // pick up things
            if (currLocX<2 && currLocX>1 && currLocZ<-1 && currLocZ>-2){
                hold = 'Torus';
            }else if (currLocX<-1 && currLocX>-2 && currLocZ<-1 && currLocZ>-2){
                hold = 'Umbrella';
            }else if (currLocX<-1 && currLocX>-2 && currLocZ<2.5 && currLocZ>0.5){
                open = !open;
            }
            break;

        case "Digit1":
            g_show1 = 1;
            g_show2 = 0;
            g_show3 = 0;
            break;

        case "Digit2":
            g_show1 = 0;
            g_show2 = 1;
            g_show3 = 0;
            break;
        
        case "Digit3":
            g_show1 = 0;
            g_show2 = 0;
            g_show3 = 1;
            break;

        case "KeyX":
            // fixed light toggle
            lamp0On = !lamp0On;
            break;
        
        case "KeyC":
            // Camera light toggle
            lamp1On = !lamp1On;
            break;
            
        case "KeyM":
            matlSel = (matlSel +1)%MATL_DEFAULT;
            matl.setMatl(matlSel);	
            console.log(matlSel)
            break;

        case "KeyB":
            isBlinn = -isBlinn;
            break;
    }
}
