import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

public class IoTClient {

	public static void main(String[] args) {
//		// TODO Auto-generated method stub
//		String endpoint = "..." ; // choose an endpoint name
//		LeshanClientBuilder builder = new LeshanClientBuilder(endpoint);
//		
//		String ipServer = null;
//		
//		try {
//			ipServer = Discovery.discoverService();
//			System.out.println(ipServer);
//		} catch (InterruptedException e) {
//			// TODO Auto-generated catch block
//			e.printStackTrace();
//		}
//		
//		// create objects
//		ObjectsInitializer initializer = new ObjectsInitializer();
//		initializer.setInstancesForObject(LwM2mId.SECURITY, Security.noSec("coap://" + ipServer + ":5683", 12345));
//		initializer.setInstancesForObject(LwM2mId.SERVER, new Server(12345, 5 * 60, BindingMode.U, false));
//		initializer.setInstancesForObject(LwM2mId.DEVICE, new Device("Eclipse Leshan", "model12345", "12345", "U"));
//
//		// add it to the client
//		builder.setObjects(initializer.create(LwM2mId.SECURITY,LwM2mId.SERVER, LwM2mId.DEVICE));
//			
//		LeshanClient client = builder.build();
//		client.start();
		
		//ProcessBuilder builder = new ProcessBuilder("alpr", "-c", "eu", "plate.jpg", "|", "awk", "'NR==2", "{print $2}'") ;
		String cmd = "awk 'NR==2 {print $2}'";
		
		ProcessBuilder builder = new ProcessBuilder("alpr", "-c eu", "plate.jpg", "| stdbuf awk", cmd) ;
		builder.redirectErrorStream(true);
		Process process = null;
		try {
			process = builder.start();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		InputStream is = process.getInputStream();
		BufferedReader reader = new BufferedReader(new InputStreamReader(is));

		String line = null;
		try {
			line = reader.readLine();
			System.out.println(line);
			
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		try {
			line = reader.readLine();
			System.out.println(line);
			
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		String plate = line.substring(line.indexOf("-") + 2, line.indexOf("c") - 2);
		System.out.println(plate);
		
	}
}

//public class ConnectivityStatistics extends BaseInstanceEnabler {
//
//	    @Override
//	    public ReadResponse read(int resourceid) {
//	        switch (resourceid) {
//	        case 0:
//	            return ReadResponse.success(resourceid, getSmsTxCounter());
//	        }
//	        return ReadResponse.notFound();
//	    }
//
//	    @Override
//	    public WriteResponse write(int resourceid, LwM2mResource value) {
//	        switch (resourceid) {
//	        case 15: 
//	            setCollectionPeriod((Long) value.getValue());
//	            return WriteResponse.success();
//	        }
//	        return WriteResponse.notFound();
//	    }
//
//	    @Override
//	    public ExecuteResponse execute(int resourceid, String params) {
//	        switch (resourceid) {
//	        case 12: 
//	            start();
//	            return ExecuteResponse.success();
//	        }
//	        return ExecuteResponse.notFound();
//	    }
//}
