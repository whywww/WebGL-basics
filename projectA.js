/**
 * @Author Haoyu Wei
 * @Date 23 Oct 2019
 * @Note Project A
 */

// Vertex Shader
var VSHADER_SOURCE = 
    'attribute vec4 a_Position;\n' +  // 4x1
    'attribute vec4 a_Color;\n' +  // Color should be RGBA, but A is optional, default 1
    'varying vec4 v_Color;\n' +
    'uniform mat4 u_modelMatrix;\n' + //  Using matrix. 4x4
    'void main(){\n' +
    '   gl_Position = u_modelMatrix * a_Position;\n' + // Matrix. See who's in the front~
    '   v_Color = a_Color;\n' +
    '}\n';
// Fragment Shader
var FSHADER_SOURCE = 
    'precision mediump float;\n' + 
    'varying vec4 v_Color;\n' +
    'void main(){\n' +
    '   gl_FragColor = v_Color;\n' +
    '}\n';


/** Global Variables */
// For 3D shapes
var floatsPerVertex = 7; 

// For animation
var currentAngle = 0.0;
var walkAngle = 0.0;
var flyAngle = 0.0;

var ANGLE_STEP = 45.0;
var walk_ANGLE_STEP = 30.0;	
var fly_ANGLE_STEP = 60.0;

var rRobot = true; // if rotate whole robot
var rLArm = true;  // robot left arm
var rRArm = true;  // robot right arm
var rHead = true; // robot head
var rLower = true; // robot lower body
var rThing = true;  // thing the robot holds
var bowStart = false;
var walkStart = false;
var flyStart = true;
var walkTmp = walk_ANGLE_STEP;
var direction = 0;
var currLoc = 0.0;
var currLocZ = 0.0;
var shapeChange = false;

// Mouse click and drag
var g_isDrag=false;
var g_xMclik=0.0;
var g_yMclik=0.0;   
var g_xMdragTot=0.0;
var g_yMdragTot=0.0; 


function main(){
    canvas = document.getElementById('gl_canvas');
    gl = getWebGLContext(canvas);
    ctx = canvas.getContext("2d", {preserveDrawingBuffer: true});
    if (!gl){
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)){
        console.log('Failed to initialize shaders');
        return;
    }

    // Event register
    selectEvent();
    window.addEventListener("mousedown", myMouseDown);
    window.addEventListener("mousemove", myMouseMove);
    window.addEventListener("mouseup", myMouseUp);
    window.addEventListener("keydown", myKeyDown, false);	
    var flySlider = document.getElementById("flySpeed");
    flySlider.oninput = function() {
        fly_ANGLE_STEP = this.value;
    }
    document.getElementById("myBtn").addEventListener("click", function(){
        shapeChange = !shapeChange;
    });

    // Set Positions for vertices
    var n = initVertexBuffers(gl);  // n is number of vertices
    if (n < 0){
        console.log('Failed to set the Positions of the vertices');
        return;
    }

    var modelMatrix = new Matrix4();

    var u_modelMatrix = gl.getUniformLocation(gl.program, 'u_modelMatrix');
    gl.uniformMatrix4fv(u_modelMatrix, false, modelMatrix.elements);  // 2nd para is Transpose. Must be false in WebGL.

    gl.clearColor(0.53, 0.8, 0.92, 1.0)
    gl.enable(gl.DEPTH_TEST); 


    var tick = function() {
        currentAngle = animate(currentAngle);  // Update the rotation angle
        // console.log(currentAngle);
        walkAngle = animateWalk(walkAngle); 
        // console.log(walkAngle);
        flyAngle = animateFly(flyAngle);
        // console.log(flyAngle/60);
        drawRobot(modelMatrix, u_modelMatrix);   // Draw shapes
        drawHelicopter(modelMatrix, u_modelMatrix)
        requestAnimationFrame(tick, canvas);   
      };
    tick();	
}

function initVertexBuffers(gl){
    makeCube();  // upper body
    makeSphere();  // head
    makeCylinder();  // legs
    makeTorus(); // things
    makeCone();  // cone
    makePyramid(); // pyramid
    // makeDiamond();
    makeGroundGrid();

    var totalSize = cubeVerts.length + sphVerts.length + cylVerts.length + torVerts.length + pyrVerts.length + coneVert.length + gndVerts.length;
    var n = totalSize / floatsPerVertex;
    var vertices = new Float32Array(totalSize);

    // copy vertices from single shapes to 'vertices'
    cubeStart = 0;
    for (i = 0, j = 0; j < cubeVerts.length; i++, j++){
        vertices[i] = cubeVerts[j];
    }
    sphStart = i;
    for (j = 0; j < sphVerts.length; i++, j++){
        vertices[i] = sphVerts[j];
    }
    cylStart = i;
    for (j = 0; j < cylVerts.length; i++, j++){
        vertices[i] = cylVerts[j];
    }
    torStart = i;
    for(j=0; j< torVerts.length; i++, j++) {
		vertices[i] = torVerts[j];
    }
    pyrStart = i;
    for(j=0; j< pyrVerts.length; i++, j++) {
		vertices[i] = pyrVerts[j];
    }
    coneStart = i;
    for(j=0; j< coneVert.length; i++, j++) {
		vertices[i] = coneVert[j];
    }
    gndStart = i;
    for(j=0; j< gndVerts.length; i++, j++) {
		vertices[i] = gndVerts[j];
    }

    // 1. Create Buffer Object
    var vertexBuffer = gl.createBuffer();
    if (!vertexBuffer){
        console.log('Failed to create vertext buffer');
        return -1;
    }

    // 2. Bind buffer obeject to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);  // Target can be gl.ELEMENT_ARRAY_BUFFER

    // 3. Write vertice positions to buffer object
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);  // gl.STREAM_DRAW, gl_DYNAMIC_DRAW. only used for optimization

    // 4. Assign buffer object to attribute variable
    // Get size per element
    var FSIZE = vertices.BYTES_PER_ELEMENT;

    // Only attribute variables are wrote here. 
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    gl.vertexAttribPointer(a_Position, 4, gl.FLOAT, false, FSIZE*floatsPerVertex, 0); 
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE*floatsPerVertex, FSIZE*4);  

    // 5. Enable the assignment to attribute variable
    gl.enableVertexAttribArray(a_Position);  // or disable...
    gl.enableVertexAttribArray(a_Color);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    return n;
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

function walkAround(modelMatrix){
    rRobot = false;
    rHead = false;
    if (direction == 0){  // not specified. walk around
        modelMatrix.translate(-walkAngle/200, 0.0, 0.0);
        // left
        if (walk_ANGLE_STEP>0 || (walk_ANGLE_STEP==0 && walkTmp >0)){
            modelMatrix.rotate(90, 0,1,0);
        }else{  // right
            modelMatrix.rotate(-90, 0,1,0);
        }
    } else if(direction == 1){ // walk right a step
        modelMatrix.translate(currLoc, 0.0, currLocZ);
        modelMatrix.rotate(-90, 0,1,0);
    } else if(direction == -1){ // walk left a step
        modelMatrix.translate(currLoc, 0.0, currLocZ);
        modelMatrix.rotate(90, 0,1,0);
    } else if(direction == 2){ // walk foward/back a step
        modelMatrix.translate(currLoc, 0.0, currLocZ);
    } else if(direction == -2){ // walk foward/back a step
        modelMatrix.translate(currLoc, 0.0, currLocZ);
        modelMatrix.rotate(180, 0,1,0);
    }
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
        modelMatrix.translate(Math.cos(flyAngle/360*6)*1.1-0.1, 0, Math.sin(flyAngle/360*6)*0.5);
    } else{
        modelMatrix.rotate(180, 0,1,0);
        modelMatrix.translate(-Math.cos(flyAngle/360*6)*1.1-0.1, 0, -Math.sin(flyAngle/360*6)*0.5);
    }

}

function changeArmLeg(modelMatrix){
    // arm
    // leg
}

/*************Make shapes here***************/
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
                sphVerts[j+3] = 1.0;																				// w.				
            }
            else {	
                sphVerts[j  ] = cosTop * Math.cos(Math.PI * (v-1)/sliceVerts); 
                sphVerts[j+1] = cosTop * Math.sin(Math.PI * (v-1)/sliceVerts);
                sphVerts[j+2] = sinTop;		
                sphVerts[j+3] = 1.0;	
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

function makeCube(){
    var faceVerts = 4;
    cubeVerts = new Float32Array((2*faceVerts+1)*6*floatsPerVertex);

    upColor = new Float32Array([0.0, 0.5, 0.0]);

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
        } else {  // central vertices
            cubeVerts[j] = 0.0;
            cubeVerts[j+1] = unitLen/2;
            cubeVerts[j+2] = 0.0;
            cubeVerts[j+3] = 1.0; 
            cubeVerts[j+4] = upColor[0];
            cubeVerts[j+5] = upColor[1];
            cubeVerts[j+6] = upColor[2];
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
        } else {  // central vertices
            cubeVerts[j] = 0.0;
            cubeVerts[j+1] = -unitLen/2;
            cubeVerts[j+2] = 0.0;
            cubeVerts[j+3] = 1.0; 
            cubeVerts[j+4] = 0.0;
            cubeVerts[j+5] = 0.2;
            cubeVerts[j+6] = 0.0;
        }
    }

    // front
    for (v = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
        if (v%2 == 0){  
            cubeVerts[j] = Math.cos(Math.PI*v/faceVerts + Math.PI/4);
            cubeVerts[j+1] = Math.sin(Math.PI*v/faceVerts + Math.PI/4);
            cubeVerts[j+2] = unitLen/2;
            cubeVerts[j+3] = 1.0;
            cubeVerts[j+4] = 0.6;
            cubeVerts[j+5] = 0.0;
            cubeVerts[j+6] = 0.6;
        } else {  // central vertices
            cubeVerts[j] = 0.0;
            cubeVerts[j+1] = 0.0;
            cubeVerts[j+2] = unitLen/2;
            cubeVerts[j+3] = 1.0; 
            cubeVerts[j+4] = 0.6;
            cubeVerts[j+5] = 0.0;
            cubeVerts[j+6] = 0.6;
        }
    }
    // back
    for (v = 0; v < (2*faceVerts+1); v++, j += floatsPerVertex){
        if (v%2 == 0){  
            cubeVerts[j] = Math.cos(Math.PI*v/faceVerts + Math.PI/4);
            cubeVerts[j+1] = Math.sin(Math.PI*v/faceVerts + Math.PI/4);
            cubeVerts[j+2] = -unitLen/2;
            cubeVerts[j+3] = 1.0;
            cubeVerts[j+4] = 0.8;
            cubeVerts[j+5] = 0.0;
            cubeVerts[j+6] = 0.8;
        } else {  // central vertices
            cubeVerts[j] = 0.0;
            cubeVerts[j+1] = 0.0;
            cubeVerts[j+2] = -unitLen/2;
            cubeVerts[j+3] = 1.0; 
            cubeVerts[j+4] = 0.8;
            cubeVerts[j+5] = 0.0;
            cubeVerts[j+6] = 0.8;
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
        } else {  // central vertices
            cubeVerts[j] = unitLen/2;
            cubeVerts[j+1] = 0.0;
            cubeVerts[j+2] = 0.0;
            cubeVerts[j+3] = 1.0; 
            cubeVerts[j+4] = 0.0;
            cubeVerts[j+5] = 0.0;
            cubeVerts[j+6] = 1.0;
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
        } else {  // central vertices
            cubeVerts[j] = -unitLen/2;
            cubeVerts[j+1] = 0.0;
            cubeVerts[j+2] = 0.0;
            cubeVerts[j+3] = 1.0; 
            cubeVerts[j+4] = 0.0;
            cubeVerts[j+5] = 0.0;
            cubeVerts[j+6] = 0.5;
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
    }
    // Create the cylinder side walls, made of 2*capVerts vertices.
    // v counts vertices within the wall; j continues to count array elements
    // START with the vertex at 1,0,-1 (completes the cylinder's bottom cap;
    // completes the 'transition edge' drawn in blue in lecture notes).
    for(v=0; v< 2*capVerts;   v++, j+=floatsPerVertex) {
        if(v%2==0)	// count verts from zero again, 
                                // and put all even# verts along outer edge of bottom cap:
        {		
                cylVerts[j  ] = Math.cos(Math.PI*(v)/capVerts);		// x
                cylVerts[j+1] = Math.sin(Math.PI*(v)/capVerts);		// y
                cylVerts[j+2] =-1.0;	// ==z  BOTTOM cap,
                cylVerts[j+3] = 1.0;	// w.
                // r,g,b = walColr[]				
                cylVerts[j+4]=walColr[0]; 
                cylVerts[j+5]=walColr[1]; 
                cylVerts[j+6]=walColr[2];			
            if(v==0) {		// UGLY TROUBLESOME vertex--shares its 1 color with THREE
                                        // triangles; 1 in cap, 1 in step, 1 in wall.
                    cylVerts[j+4] = errColr[0]; 
                    cylVerts[j+5] = errColr[1];
                    cylVerts[j+6] = errColr[2];		// (make it red; see lecture notes)
                }
        }
        else		// position all odd# vertices along the top cap (not yet created)
        {
                cylVerts[j  ] = topRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
                cylVerts[j+1] = topRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
                cylVerts[j+2] = 1.0;	// == z TOP cap,
                cylVerts[j+3] = 1.0;	// w.
                // r,g,b = walColr;
                cylVerts[j+4]=walColr[0]; 
                cylVerts[j+5]=walColr[1]; 
                cylVerts[j+6]=walColr[2];			
        }
    }
    // Complete the cylinder with its top cap, made of 2*capVerts -1 vertices.
    // v counts the vertices in the cap; j continues to count array elements.
    for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
        // count vertices from zero again, and
        if(v%2==0) {	// position even #'d vertices around top cap's outer edge.
            cylVerts[j  ] = topRadius * Math.cos(Math.PI*(v)/capVerts);		// x
            cylVerts[j+1] = topRadius * Math.sin(Math.PI*(v)/capVerts);		// y
            cylVerts[j+2] = 1.0;	// z
            cylVerts[j+3] = 1.0;	// w.
            // r,g,b = topColr[]
            cylVerts[j+4]=topColr[0]; 
            cylVerts[j+5]=topColr[1]; 
            cylVerts[j+6]=topColr[2];
            if(v==0) {	// UGLY TROUBLESOME vertex--shares its 1 color with THREE
                                        // triangles; 1 in cap, 1 in step, 1 in wall.
                    cylVerts[j+4] = errColr[0]; 
                    cylVerts[j+5] = errColr[1];
                    cylVerts[j+6] = errColr[2];		// (make it red; see lecture notes)
            }		
        }
        else {				// position odd#'d vertices at center of the top cap:
            cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
            cylVerts[j+1] = 0.0;	
            cylVerts[j+2] = 1.0; 
            cylVerts[j+3] = 1.0;			
            // r,g,b = topColr[]
            cylVerts[j+4]=ctrColr[0]; 
            cylVerts[j+5]=ctrColr[1]; 
            cylVerts[j+6]=ctrColr[2];
        }
    }
}

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at the origin.  Draw this shape using the GL_LINES primitive.

    var xcount = 100;			// # of lines to draw in x,y to make the grid.
    var ycount = 100;		
    var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
        var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
        var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
        
    // Create an (global) array to hold this ground-plane's vertices:
    gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
                        // draw a grid made of xcount+ycount lines; 2 vertices per line.
                        
    var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
    var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
    
    // First, step thru x values as we make vertical lines of constant-x:
    for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
        if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
            gndVerts[j  ] = -xymax + (v  )*xgap;	// x
            gndVerts[j+1] = -xymax;								// y
            gndVerts[j+2] = 0.0;									// z
            gndVerts[j+3] = 1.0;									// w.
        }
        else {				// put odd-numbered vertices at (xnow, +xymax, 0).
            gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
            gndVerts[j+1] = xymax;								// y
            gndVerts[j+2] = 0.0;									// z
            gndVerts[j+3] = 1.0;									// w.
        }
        gndVerts[j+4] = xColr[0];			// red
        gndVerts[j+5] = xColr[1];			// grn
        gndVerts[j+6] = xColr[2];			// blu
    }
    // Second, step thru y values as wqe make horizontal lines of constant-y:
    // (don't re-initialize j--we're adding more vertices to the array)
    for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
        if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
            gndVerts[j  ] = -xymax;								// x
            gndVerts[j+1] = -xymax + (v  )*ygap;	// y
            gndVerts[j+2] = 0.0;									// z
            gndVerts[j+3] = 1.0;									// w.
        }
        else {					// put odd-numbered vertices at (+xymax, ynow, 0).
            gndVerts[j  ] = xymax;								// x
            gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
            gndVerts[j+2] = 0.0;									// z
            gndVerts[j+3] = 1.0;									// w.
        }
        gndVerts[j+4] = yColr[0];			// red
        gndVerts[j+5] = yColr[1];			// grn
        gndVerts[j+6] = yColr[2];			// blu
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
    }

    // wall
    for (v = 0; v < 2*botVert+1; v++, j+=floatsPerVertex){
        if (v%2 == 0){
            pyrVerts[j] = Math.cos(Math.PI*v/botVert);
            pyrVerts[j+1] = Math.sin(Math.PI*v/botVert);
            pyrVerts[j+2] = 0.0;
            pyrVerts[j+3] = 1.0;
            pyrVerts[j+4] = 0.0;
            pyrVerts[j+5] = Math.random()/2;
            pyrVerts[j+6] = 0.0;
        } else{
            pyrVerts[j] = 0.0;
            pyrVerts[j+1] = 0.0;
            pyrVerts[j+2] = 1.0;
            pyrVerts[j+3] = 1.0;
            pyrVerts[j+4] = 0.0;
            pyrVerts[j+5] = Math.random()/2;
            pyrVerts[j+6] = 0.0;
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

// function makeDiamond() {
//     var topnum = 4;
//     var extendRate = 1.5;
//     var radius = 45;
//     dmVerts = new Float32Array(4*topnum+3);

//     // top
//     for (v = 0, j = 0; v < 2*topnum+1; v++, j+=floatsPerVertex){
//         if (v%2 == 0){
//             dmVerts[j] = Math.cos(Math.PI*v/topnum);
//             dmVerts[j+1] = Math.sin(Math.PI*v/topnum);
//             dmVerts[j+2] = 0.0;
//             dmVerts[j+3] = 1.0;
//             dmVerts[j+4] = 1.0;
//             dmVerts[j+5] = 1.0;
//             dmVerts[j+6] = 0.0;
//         }
//         else{
//             dmVerts[j] = 0.0;
//             dmVerts[j+1] = 0.0;
//             dmVerts[j+2] = 0.0;
//             dmVerts[j+3] = 1.0;
//             dmVerts[j+4] = 1.0;
//             dmVerts[j+5] = 1.0;
//             dmVerts[j+6] = 0.0;
//         }
//     }

//     // second layer
//     for (v = 0; v < 2*topnum+2; v++, j+=floatsPerVertex){
//         if (v%2 == 0){
//             dmVerts[j] = Math.cos(Math.PI*v/topnum);
//             dmVerts[j+1] = Math.sin(Math.PI*v/topnum);
//             dmVerts[j+2] = 0.0;
//             dmVerts[j+3] = 1.0;
//             dmVerts[j+4] = 1.0;
//             dmVerts[j+5] = 1.0;
//             dmVerts[j+6] = 0.0;
//         }
//         else{
//             dmVerts[j] = extendRate*Math.cos(Math.PI*v/topnum);
//             dmVerts[j+1] = extendRate*Math.sin(Math.PI*v/topnum);
//             dmVerts[j+2] = extendRate*Math.sin(radius);
//             dmVerts[j+3] = 1.0;
//             dmVerts[j+4] = 1.0;
//             dmVerts[j+5] = 1.0;
//             dmVerts[j+6] = 0.0;
//         }
//     }
// }

/*************Draw parts here***************/
function drawRobot(modelMatrix, u_ModelMatrix){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);

    /************Robot group**************/
    // do robot transformation...
    modelMatrix.setTranslate(0.0, -0.3, 0.0);
    // mouse drag rotation
    modelMatrix.rotate(dist*120.0, g_yMdragTot+0.0001, -g_xMdragTot+0.0001, 0.0);    

    if (walkStart){
        walkAround(modelMatrix);
    }
    if (rRobot){
        modelMatrix.rotate(currentAngle, 0, 1, 0);
        // modelMatrix.rotate(currentAngle/5, 1, 0, 0);	// spin more slowly on x.
    }
    
    pushMatrix(modelMatrix); // for lower body
    if (bowStart){
        bow(modelMatrix, (currentAngle-50)/2);
    }
    pushMatrix(modelMatrix); // for head

    /***********Draw body(cube)**************/
    modelMatrix.scale(0.25, 0.3, 0.2);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
    
    /***********Draw arms group(cube+torus/pyramaid)**************/
    drawArms(modelMatrix, u_ModelMatrix);

    /*************Draw head(sphere)****************/
    modelMatrix = popMatrix();    
    drawHead(modelMatrix, u_ModelMatrix);

    /**********Draw lower body(cyclinder+cube) group********/
    drawLowerBody(modelMatrix, u_ModelMatrix);

    /***********Draw ground grid**************/
	modelMatrix.setTranslate( 0.4, -0.4, 0.0);	
	modelMatrix.scale(0.1, 0.1, 0.1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.LINES, gndStart/floatsPerVertex, gndVerts.length/floatsPerVertex);
}

function drawHead(modelMatrix, u_ModelMatrix){
    // Draw head(sphere):
    modelMatrix.translate(0.0, unitLen*0.25, 0.0);
    modelMatrix.scale(0.15,0.15,0.15);
    if (rHead){
        modelMatrix.rotate(currentAngle, 0, 1, 0);
    }
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphStart/floatsPerVertex, sphVerts.length/floatsPerVertex);
}

function drawArms(modelMatrix, u_ModelMatrix){
    pushMatrix(modelMatrix);
    // draw left arm
    modelMatrix.translate(-unitLen*0.55, unitLen*0.4, 0);
    if (rLArm){
        modelMatrix.rotate(currentAngle*0.8, 1,0,0);
    }
    modelMatrix.rotate(-30, 0,0,1);
    modelMatrix.scale(0.2, 0.8, 0.25);
    modelMatrix.translate(0,-unitLen*0.6,0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);

    // pincers group
    pushMatrix(modelMatrix);
    pushMatrix(modelMatrix);
    // draw left jaw
    modelMatrix.translate(-unitLen*0.3, -unitLen*0.6, 0);
    modelMatrix.scale(0.25,0.2,0.25);    
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
    modelMatrix = popMatrix();
    // draw right jaw...
    modelMatrix.translate(unitLen*0.3, -unitLen*0.6, 0);
    modelMatrix.scale(0.25,0.2,0.25);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
    
    modelMatrix = popMatrix();
    // hold something
    // inverse
    modelMatrix.translate(0, unitLen*0.6, 0);
    modelMatrix.scale(1/0.2, 1/0.8, 1/0.25);
    modelMatrix.rotate(30, 0,0,1);
    var hold = mypick.options[index].value;
    if (hold == 'torus'){
        drawTorus(modelMatrix, u_ModelMatrix);
    }else if(hold == 'arrow'){
        drawArrow(modelMatrix, u_ModelMatrix);
    }else if(hold == 'diamond'){
        drawDiamondWand(modelMatrix, u_ModelMatrix);
    }

    modelMatrix = popMatrix();
    // draw right arm
    // modelMatrix.rotate(30, 0, 0, 1);// draw right arm
    modelMatrix.translate(unitLen*0.55, unitLen*0.4, 0);
    if (rRArm){
        modelMatrix.rotate(-currentAngle*0.8, 1,0,0);
    }
    modelMatrix.rotate(30, 0,0,1);
    modelMatrix.scale(0.2, 0.8, 0.25);
    modelMatrix.translate(0,-unitLen*0.6,0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
    pushMatrix(modelMatrix);
    // draw left jaw
    modelMatrix.translate(-unitLen*0.3, -unitLen*0.6, 0.0);
    modelMatrix.scale(0.25,0.2,0.25);    
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
    modelMatrix = popMatrix();
    // draw right jaw...
    modelMatrix.translate(unitLen*0.3, -unitLen*0.6, 0);
    modelMatrix.scale(0.25,0.2,0.25);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
}

function drawLowerBody(modelMatrix, u_ModelMatrix){
    modelMatrix = popMatrix();
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
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
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
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
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
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
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
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
}

function drawTorus(modelMatrix, u_ModelMatrix){
    modelMatrix.translate(-unitLen*0.51, -unitLen*1.38, 0);
    modelMatrix.rotate(60, 0,1,0);
    modelMatrix.rotate(currentAngle, 0,0,1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, torStart/floatsPerVertex, torVerts.length/floatsPerVertex);
}

function drawArrow(modelMatrix, u_ModelMatrix){
    // cube
    pushMatrix(modelMatrix)
    modelMatrix.translate(-unitLen*0.51, -unitLen*1.38, 0.0);
    modelMatrix.scale(0.05, 1.0, 0.05);
    // modelMatrix.rotate(currentAngle, 0,1,0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
    
    modelMatrix = popMatrix(modelMatrix);
    modelMatrix.translate(-unitLen, -unitLen*1.3, 0);
    modelMatrix.rotate(90, 1,0,0);
    modelMatrix.translate(0.7, 0, 0);
    modelMatrix.scale(0.2,0.2,1.5);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, coneStart/floatsPerVertex, coneVert.length/floatsPerVertex);
}

function drawDiamondWand(modelMatrix, u_ModelMatrix){
    // cube
    pushMatrix(modelMatrix)
    modelMatrix.translate(-unitLen*0.51, -unitLen*1.38, 0.0);
    // modelMatrix.rotate(60, 1,0,0);
    modelMatrix.scale(0.05, 1.0, 0.05);
    // modelMatrix.rotate(currentAngle, 0,1,0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
    
    modelMatrix = popMatrix(modelMatrix);
    // inverse
    modelMatrix.translate(-unitLen, -unitLen*1.88, 0);
    modelMatrix.rotate(90, 1,0,0);
    modelMatrix.translate(0.7, 0, 0);
    modelMatrix.scale(0.2,0.2,0.2);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, dmStart/floatsPerVertex, dmVerts.length/floatsPerVertex);
}

function drawHelicopter(modelMatrix, u_ModelMatrix){
    modelMatrix.setTranslate(0.0, 0.6, 0);
    modelMatrix.rotate(10, 1,0,0);
    modelMatrix.rotate(10, 0,1,0);
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
    // modelMatrix.rotate(currentAngle, 0,0,1);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, sphStart/floatsPerVertex, sphVerts.length/floatsPerVertex);

    // draw rear wing
    modelMatrix = popMatrix();
    modelMatrix.translate(0.3, 0.0, 0.0);
    modelMatrix.rotate(90, 0,1,0);
    modelMatrix.scale(0.03,0.03,0.7);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
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
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);

    modelMatrix = popMatrix();
    modelMatrix.rotate((flyAngle+90)*15, 0,1,0);
    modelMatrix.scale(0.4,0.01, 0.03);
    modelMatrix.translate(-0.7,0,0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);

    modelMatrix = popMatrix();
    modelMatrix.rotate((flyAngle+180)*15, 0,1,0);
    modelMatrix.scale(0.4,0.01, 0.03);
    modelMatrix.translate(-0.7,0,0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);

    modelMatrix = popMatrix();
    modelMatrix.rotate((flyAngle+270)*15, 0,1,0);
    modelMatrix.scale(0.4,0.01, 0.03);
    modelMatrix.translate(-0.7,0,0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);

    // up cube
    modelMatrix = popMatrix();
    modelMatrix.translate(0, 0.25, 0.0);
    modelMatrix.rotate(-90, 1,0,0);
    modelMatrix.rotate(flyAngle, 0,0,1);
    modelMatrix.scale(0.02,0.02,0.05);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
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
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);

    modelMatrix = popMatrix();
    modelMatrix.rotate((flyAngle+90)*15, 0,1,0);
    modelMatrix.scale(0.1,0.01, 0.03);
    modelMatrix.translate(-0.7,0,0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);

    modelMatrix = popMatrix();
    modelMatrix.rotate((flyAngle+180)*15, 0,1,0);
    modelMatrix.scale(0.1,0.01, 0.03);
    modelMatrix.translate(-0.7,0,0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
   
    modelMatrix = popMatrix();
    modelMatrix.rotate((flyAngle+270)*15, 0,1,0);
    modelMatrix.scale(0.1,0.01, 0.03);
    modelMatrix.translate(-0.7,0,0);
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
    gl.drawArrays(gl.TRIANGLE_STRIP, cubeStart/floatsPerVertex, cubeVerts.length/floatsPerVertex);
}

/*************Register events here***************/
function runStop() {
    if(ANGLE_STEP*ANGLE_STEP > 1) {  // stop currentAngle
        myTmp = ANGLE_STEP;
        ANGLE_STEP = 0;
    }
    if(walk_ANGLE_STEP*walk_ANGLE_STEP > 1){  // stop walking
        walkTmp = walk_ANGLE_STEP;
        walk_ANGLE_STEP = 0;
    }
    else {
        ANGLE_STEP = myTmp;
        walk_ANGLE_STEP = walkTmp;
    }
}

function selectEvent(){
    mypick=document.getElementById("selectThings");
    index=mypick.selectedIndex;
}

function bowEvent(){
    bowStart = !bowStart;
    if (bowStart){
        rRobot = false;
        rLArm = false; 
        rRArm = false; 
        rHead = false; 
        rLower = false; 
        rThing = false;
    }else{
        rRobot = true;
        rLArm = true; 
        rRArm = true; 
        rHead = true; 
        rLower = true; 
        rThing = true;
    }
    walkStart = false;
}

function walkEvent(){
    // stop any motion
    if (bowStart){
        bowEvent();
    } 
    rRobot = !rRobot;
    walkStart = !walkStart;
}

function myMouseDown(ev) {  
    var rect = ev.target.getBoundingClientRect();
    var xp = ev.clientX - rect.left;
    var yp = canvas.height - (ev.clientY - rect.top);
    // webgl(CVV) coords
    var x = (xp - canvas.width/2) / (canvas.width/2);
    var y = (yp - canvas.height/2) / (canvas.height/2);
    g_isDrag = true;
    g_xMclik = x;	
    g_yMclik = y;
    if (y>0 && x<1){
        runStopHeli();
    }
}

function myMouseMove(ev){
    if(g_isDrag==false) return;	

    var rect = ev.target.getBoundingClientRect();	
    var xp = ev.clientX - rect.left;							
    var yp = canvas.height - (ev.clientY - rect.top);
    
    var x = (xp - canvas.width/2) / (canvas.width/2);	
    var y = (yp - canvas.height/2) / (canvas.height/2);

    g_xMdragTot += (x - g_xMclik);
    g_yMdragTot += (y - g_yMclik);
    g_xMclik = x;
    g_yMclik = y;
}

function myMouseUp(ev) {
    var rect = ev.target.getBoundingClientRect();	
    var xp = ev.clientX - rect.left;							
    var yp = canvas.height - (ev.clientY - rect.top);

    var x = (xp - canvas.width/2) /	(canvas.width/2);		
    var y = (yp - canvas.height/2) / (canvas.height/2);

    g_isDrag = false;	
    g_xMdragTot += (x - g_xMclik);
    g_yMdragTot += (y - g_yMclik);
    
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
            if (bowStart){
                bowEvent();
            }
            walkStart = true;
            direction = -1;
            currLoc -= Math.abs(walk_ANGLE_STEP)/200;
            // console.log(walk_ANGLE_STEP);
            break;

        case "KeyD":
            // walk right
            if (bowStart){
                bowEvent();
            }
            walkStart = true;
            direction = 1;
            currLoc += Math.abs(walk_ANGLE_STEP)/200;
            // console.log(walk_ANGLE_STEP);
            break;

        case "KeyW":
            // walk foward
            if (bowStart){
                bowEvent();
            }
            walkStart = true;
            direction = 2;
            currLocZ -= Math.abs(walk_ANGLE_STEP)/200;
            break;
        case "KeyS":
            // walk back
            if (bowStart){
                bowEvent();
            }
            walkStart = true;
            direction = -2;
            currLocZ += Math.abs(walk_ANGLE_STEP)/200;
            break;
    }
}

function speedUp() {
    if (walk_ANGLE_STEP > 0){
        walk_ANGLE_STEP += 10; 
    }else{
        walk_ANGLE_STEP -= 10;
    }

    console.log(walk_ANGLE_STEP);
}
    
function speedDown() {
    if (walk_ANGLE_STEP > 0){
        walk_ANGLE_STEP -= 10; 
    }else{
        walk_ANGLE_STEP += 10;
    }
    console.log(walk_ANGLE_STEP);
}

function runStopHeli(){
    if(fly_ANGLE_STEP*fly_ANGLE_STEP > 1) {  // stop currentAngle
        flyTmp = fly_ANGLE_STEP;
        fly_ANGLE_STEP = 0;
    }else {
        fly_ANGLE_STEP = flyTmp;
    }
}